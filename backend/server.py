from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Railway Collection API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class FunctionMapping(BaseModel):
    function_number: str  # F0-F28
    description: str
    is_sound: bool = False

class CVModification(BaseModel):
    cv_number: int
    value: int
    description: str

class LocomotiveBase(BaseModel):
    brand: str
    model: str
    reference: str
    locomotive_type: str = "electrica"  # electrica, vapor, diesel, automotor, alta_velocidad, otro
    # Prototipo fields
    paint_scheme: Optional[str] = None  # Esquema de pintura
    registration_number: Optional[str] = None  # Matrícula/Número
    prototype_type: Optional[str] = None  # Tipo de prototipo
    # DCC fields
    dcc_address: int
    decoder_brand: Optional[str] = None
    decoder_model: Optional[str] = None
    sound_project: Optional[str] = None
    purchase_date: Optional[str] = None
    price: Optional[float] = None
    condition: str = "nuevo"  # nuevo, usado, restaurado
    era: Optional[str] = None
    railway_company: Optional[str] = None
    notes: Optional[str] = None
    photo: Optional[str] = None  # base64 encoded
    functions: List[FunctionMapping] = []
    cv_modifications: List[CVModification] = []

# ============== ROLLING STOCK (VAGONES/COCHES) MODELS ==============

class RollingStockBase(BaseModel):
    brand: str
    model: str
    reference: str
    stock_type: str = "vagon_mercancias"  # vagon_mercancias, coche_viajeros, furgon, otro
    purchase_date: Optional[str] = None
    price: Optional[float] = None
    condition: str = "nuevo"  # nuevo, usado, restaurado
    era: Optional[str] = None
    railway_company: Optional[str] = None
    notes: Optional[str] = None
    photo: Optional[str] = None  # base64 encoded

class RollingStockCreate(RollingStockBase):
    pass

class RollingStock(RollingStockBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LocomotiveCreate(LocomotiveBase):
    pass

class Locomotive(LocomotiveBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DecoderBase(BaseModel):
    brand: str
    model: str
    type: str  # sound, basic, multiprotocol
    scale: str = "N"
    interface: str  # NEM651, NEM652, Next18, PluX16, etc.
    sound_capable: bool = False
    max_functions: int = 28
    notes: Optional[str] = None

class DecoderCreate(DecoderBase):
    pass

class Decoder(DecoderBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SoundProjectBase(BaseModel):
    name: str
    decoder_brand: str
    decoder_model: str
    locomotive_type: str
    version: Optional[str] = None
    sounds: List[str] = []
    notes: Optional[str] = None

class SoundProjectCreate(SoundProjectBase):
    pass

class SoundProject(SoundProjectBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatsResponse(BaseModel):
    total_locomotives: int
    total_rolling_stock: int
    total_decoders: int
    total_sound_projects: int
    total_wishlist: int
    total_value: float
    wishlist_value: float
    locomotives_by_brand: Dict[str, int]
    locomotives_by_company: Dict[str, int]
    locomotives_by_condition: Dict[str, int]
    locomotives_by_decoder: Dict[str, int]
    locomotives_by_type: Dict[str, int]
    rolling_stock_by_type: Dict[str, int]

# ============== WISHLIST MODELS ==============

class WishlistItemBase(BaseModel):
    item_type: str = "locomotora"  # locomotora, vagon, accesorio
    brand: str
    model: str
    reference: str
    estimated_price: Optional[float] = None
    priority: int = 2  # 1=alta, 2=media, 3=baja
    store: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None

class WishlistItemCreate(WishlistItemBase):
    pass

class WishlistItem(WishlistItemBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== COMPOSITION MODELS ==============

class CompositionWagon(BaseModel):
    wagon_id: str
    position: int  # Order in the composition (1, 2, 3...)

class CompositionBase(BaseModel):
    name: str
    service_type: str = "pasajeros"  # pasajeros, mercancias, mixto
    era: Optional[str] = None
    locomotive_id: Optional[str] = None  # Reference to locomotive
    wagons: List[CompositionWagon] = []  # Ordered list of wagons
    notes: Optional[str] = None

class CompositionCreate(CompositionBase):
    pass

class Composition(CompositionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============== CSV IMPORT MODELS ==============

class CSVImportResult(BaseModel):
    success: bool
    imported_count: int
    skipped_count: int
    errors: List[str]
    imported_items: List[dict]

# ============== LOCOMOTIVE ENDPOINTS ==============

@api_router.get("/locomotives", response_model=List[Locomotive])
async def get_locomotives():
    locomotives = await db.locomotives.find({}, {"_id": 0}).to_list(1000)
    for loco in locomotives:
        if isinstance(loco.get('created_at'), str):
            loco['created_at'] = datetime.fromisoformat(loco['created_at'])
        if isinstance(loco.get('updated_at'), str):
            loco['updated_at'] = datetime.fromisoformat(loco['updated_at'])
    return locomotives

@api_router.get("/locomotives/{locomotive_id}", response_model=Locomotive)
async def get_locomotive(locomotive_id: str):
    locomotive = await db.locomotives.find_one({"id": locomotive_id}, {"_id": 0})
    if not locomotive:
        raise HTTPException(status_code=404, detail="Locomotora no encontrada")
    if isinstance(locomotive.get('created_at'), str):
        locomotive['created_at'] = datetime.fromisoformat(locomotive['created_at'])
    if isinstance(locomotive.get('updated_at'), str):
        locomotive['updated_at'] = datetime.fromisoformat(locomotive['updated_at'])
    return locomotive

@api_router.post("/locomotives", response_model=Locomotive)
async def create_locomotive(locomotive: LocomotiveCreate):
    loco_dict = locomotive.model_dump()
    loco_obj = Locomotive(**loco_dict)
    doc = loco_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.locomotives.insert_one(doc)
    return loco_obj

@api_router.put("/locomotives/{locomotive_id}", response_model=Locomotive)
async def update_locomotive(locomotive_id: str, locomotive: LocomotiveCreate):
    existing = await db.locomotives.find_one({"id": locomotive_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Locomotora no encontrada")
    
    update_data = locomotive.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_data['id'] = locomotive_id
    update_data['created_at'] = existing.get('created_at', datetime.now(timezone.utc).isoformat())
    
    await db.locomotives.update_one({"id": locomotive_id}, {"$set": update_data})
    
    updated = await db.locomotives.find_one({"id": locomotive_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return updated

@api_router.delete("/locomotives/{locomotive_id}")
async def delete_locomotive(locomotive_id: str):
    result = await db.locomotives.delete_one({"id": locomotive_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Locomotora no encontrada")
    return {"message": "Locomotora eliminada"}

# ============== DECODER ENDPOINTS ==============

@api_router.get("/decoders", response_model=List[Decoder])
async def get_decoders():
    decoders = await db.decoders.find({}, {"_id": 0}).to_list(1000)
    for dec in decoders:
        if isinstance(dec.get('created_at'), str):
            dec['created_at'] = datetime.fromisoformat(dec['created_at'])
    return decoders

@api_router.get("/decoders/{decoder_id}", response_model=Decoder)
async def get_decoder(decoder_id: str):
    decoder = await db.decoders.find_one({"id": decoder_id}, {"_id": 0})
    if not decoder:
        raise HTTPException(status_code=404, detail="Decodificador no encontrado")
    if isinstance(decoder.get('created_at'), str):
        decoder['created_at'] = datetime.fromisoformat(decoder['created_at'])
    return decoder

@api_router.post("/decoders", response_model=Decoder)
async def create_decoder(decoder: DecoderCreate):
    dec_dict = decoder.model_dump()
    dec_obj = Decoder(**dec_dict)
    doc = dec_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.decoders.insert_one(doc)
    return dec_obj

@api_router.put("/decoders/{decoder_id}", response_model=Decoder)
async def update_decoder(decoder_id: str, decoder: DecoderCreate):
    existing = await db.decoders.find_one({"id": decoder_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Decodificador no encontrado")
    
    update_data = decoder.model_dump()
    update_data['id'] = decoder_id
    update_data['created_at'] = existing.get('created_at', datetime.now(timezone.utc).isoformat())
    
    await db.decoders.update_one({"id": decoder_id}, {"$set": update_data})
    
    updated = await db.decoders.find_one({"id": decoder_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/decoders/{decoder_id}")
async def delete_decoder(decoder_id: str):
    result = await db.decoders.delete_one({"id": decoder_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Decodificador no encontrado")
    return {"message": "Decodificador eliminado"}

# ============== SOUND PROJECT ENDPOINTS ==============

@api_router.get("/sound-projects", response_model=List[SoundProject])
async def get_sound_projects():
    projects = await db.sound_projects.find({}, {"_id": 0}).to_list(1000)
    for proj in projects:
        if isinstance(proj.get('created_at'), str):
            proj['created_at'] = datetime.fromisoformat(proj['created_at'])
    return projects

@api_router.get("/sound-projects/{project_id}", response_model=SoundProject)
async def get_sound_project(project_id: str):
    project = await db.sound_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto de sonido no encontrado")
    if isinstance(project.get('created_at'), str):
        project['created_at'] = datetime.fromisoformat(project['created_at'])
    return project

@api_router.post("/sound-projects", response_model=SoundProject)
async def create_sound_project(project: SoundProjectCreate):
    proj_dict = project.model_dump()
    proj_obj = SoundProject(**proj_dict)
    doc = proj_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.sound_projects.insert_one(doc)
    return proj_obj

@api_router.put("/sound-projects/{project_id}", response_model=SoundProject)
async def update_sound_project(project_id: str, project: SoundProjectCreate):
    existing = await db.sound_projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Proyecto de sonido no encontrado")
    
    update_data = project.model_dump()
    update_data['id'] = project_id
    update_data['created_at'] = existing.get('created_at', datetime.now(timezone.utc).isoformat())
    
    await db.sound_projects.update_one({"id": project_id}, {"$set": update_data})
    
    updated = await db.sound_projects.find_one({"id": project_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/sound-projects/{project_id}")
async def delete_sound_project(project_id: str):
    result = await db.sound_projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proyecto de sonido no encontrado")
    return {"message": "Proyecto de sonido eliminado"}

# ============== ROLLING STOCK ENDPOINTS ==============

@api_router.get("/rolling-stock", response_model=List[RollingStock])
async def get_rolling_stock():
    stock = await db.rolling_stock.find({}, {"_id": 0}).to_list(1000)
    for item in stock:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('updated_at'), str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return stock

@api_router.get("/rolling-stock/{stock_id}", response_model=RollingStock)
async def get_rolling_stock_item(stock_id: str):
    item = await db.rolling_stock.find_one({"id": stock_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Material rodante no encontrado")
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return item

@api_router.post("/rolling-stock", response_model=RollingStock)
async def create_rolling_stock(stock: RollingStockCreate):
    stock_dict = stock.model_dump()
    stock_obj = RollingStock(**stock_dict)
    doc = stock_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.rolling_stock.insert_one(doc)
    return stock_obj

@api_router.put("/rolling-stock/{stock_id}", response_model=RollingStock)
async def update_rolling_stock(stock_id: str, stock: RollingStockCreate):
    existing = await db.rolling_stock.find_one({"id": stock_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Material rodante no encontrado")
    
    update_data = stock.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_data['id'] = stock_id
    update_data['created_at'] = existing.get('created_at', datetime.now(timezone.utc).isoformat())
    
    await db.rolling_stock.update_one({"id": stock_id}, {"$set": update_data})
    
    updated = await db.rolling_stock.find_one({"id": stock_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return updated

@api_router.delete("/rolling-stock/{stock_id}")
async def delete_rolling_stock(stock_id: str):
    result = await db.rolling_stock.delete_one({"id": stock_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material rodante no encontrado")
    return {"message": "Material rodante eliminado"}

# ============== STATISTICS ENDPOINT ==============

@api_router.get("/stats", response_model=StatsResponse)
async def get_stats():
    locomotives = await db.locomotives.find({}, {"_id": 0}).to_list(1000)
    rolling_stock = await db.rolling_stock.find({}, {"_id": 0}).to_list(1000)
    decoders = await db.decoders.find({}, {"_id": 0}).to_list(1000)
    sound_projects = await db.sound_projects.find({}, {"_id": 0}).to_list(1000)
    
    total_value = sum(loco.get('price', 0) or 0 for loco in locomotives)
    total_value += sum(stock.get('price', 0) or 0 for stock in rolling_stock)
    
    by_brand = {}
    by_company = {}
    by_condition = {}
    by_decoder = {}
    by_loco_type = {}
    
    for loco in locomotives:
        brand = loco.get('brand', 'Desconocido')
        by_brand[brand] = by_brand.get(brand, 0) + 1
        
        company = loco.get('railway_company', 'Sin especificar')
        if company:
            by_company[company] = by_company.get(company, 0) + 1
        
        condition = loco.get('condition', 'nuevo')
        by_condition[condition] = by_condition.get(condition, 0) + 1
        
        decoder = loco.get('decoder_brand', 'Sin decodificador')
        if decoder:
            by_decoder[decoder] = by_decoder.get(decoder, 0) + 1
        
        loco_type = loco.get('locomotive_type', 'otro')
        by_loco_type[loco_type] = by_loco_type.get(loco_type, 0) + 1
    
    by_stock_type = {}
    for stock in rolling_stock:
        stock_type = stock.get('stock_type', 'otro')
        by_stock_type[stock_type] = by_stock_type.get(stock_type, 0) + 1
    
    # Wishlist stats
    wishlist = await db.wishlist.find({}, {"_id": 0}).to_list(1000)
    wishlist_value = sum(item.get('estimated_price', 0) or 0 for item in wishlist)
    
    return StatsResponse(
        total_locomotives=len(locomotives),
        total_rolling_stock=len(rolling_stock),
        total_decoders=len(decoders),
        total_sound_projects=len(sound_projects),
        total_wishlist=len(wishlist),
        total_value=total_value,
        wishlist_value=wishlist_value,
        locomotives_by_brand=by_brand,
        locomotives_by_company=by_company,
        locomotives_by_condition=by_condition,
        locomotives_by_decoder=by_decoder,
        locomotives_by_type=by_loco_type,
        rolling_stock_by_type=by_stock_type
    )

# ============== ROOT ENDPOINT ==============

@api_router.get("/")
async def root():
    return {"message": "Railway Collection API", "version": "1.0.0"}

# ============== BACKUP/RESTORE ENDPOINTS ==============

class BackupData(BaseModel):
    version: str = "1.0"
    created_at: str
    locomotives: List[dict]
    rolling_stock: List[dict]
    decoders: List[dict]
    sound_projects: List[dict]

class BackupHistoryEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    type: str = "manual"  # manual, restore
    locomotives_count: int = 0
    rolling_stock_count: int = 0
    decoders_count: int = 0
    sound_projects_count: int = 0

class BackupSettings(BaseModel):
    reminder_enabled: bool = False
    reminder_frequency: str = "weekly"  # daily, weekly, monthly
    last_reminder_shown: Optional[str] = None

@api_router.get("/backup")
async def create_backup():
    """Export all data as a backup and record in history"""
    locomotives = await db.locomotives.find({}, {"_id": 0}).to_list(10000)
    rolling_stock = await db.rolling_stock.find({}, {"_id": 0}).to_list(10000)
    decoders = await db.decoders.find({}, {"_id": 0}).to_list(10000)
    sound_projects = await db.sound_projects.find({}, {"_id": 0}).to_list(10000)
    
    # Record backup in history
    history_entry = BackupHistoryEntry(
        type="manual",
        locomotives_count=len(locomotives),
        rolling_stock_count=len(rolling_stock),
        decoders_count=len(decoders),
        sound_projects_count=len(sound_projects)
    )
    history_doc = history_entry.model_dump()
    history_doc['created_at'] = history_doc['created_at'].isoformat()
    await db.backup_history.insert_one(history_doc)
    
    backup = {
        "version": "1.0",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "locomotives": locomotives,
        "rolling_stock": rolling_stock,
        "decoders": decoders,
        "sound_projects": sound_projects
    }
    
    return backup

@api_router.get("/backup/history")
async def get_backup_history():
    """Get backup history"""
    history = await db.backup_history.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for entry in history:
        if isinstance(entry.get('created_at'), str):
            entry['created_at'] = datetime.fromisoformat(entry['created_at'])
    return history

@api_router.delete("/backup/history")
async def clear_backup_history():
    """Clear backup history"""
    await db.backup_history.delete_many({})
    return {"message": "Historial de backups eliminado"}

@api_router.get("/backup/settings")
async def get_backup_settings():
    """Get backup reminder settings"""
    settings = await db.backup_settings.find_one({}, {"_id": 0})
    if not settings:
        default_settings = BackupSettings()
        return default_settings.model_dump()
    return settings

@api_router.post("/backup/settings")
async def save_backup_settings(settings: BackupSettings):
    """Save backup reminder settings"""
    settings_dict = settings.model_dump()
    await db.backup_settings.delete_many({})
    await db.backup_settings.insert_one(settings_dict)
    # Fetch and return the saved settings without _id
    saved_settings = await db.backup_settings.find_one({}, {"_id": 0})
    return saved_settings

@api_router.post("/restore")
async def restore_backup(backup: BackupData):
    """Restore data from a backup (replaces all existing data)"""
    try:
        # Clear existing collections
        await db.locomotives.delete_many({})
        await db.rolling_stock.delete_many({})
        await db.decoders.delete_many({})
        await db.sound_projects.delete_many({})
        
        # Restore data
        if backup.locomotives:
            await db.locomotives.insert_many(backup.locomotives)
        if backup.rolling_stock:
            await db.rolling_stock.insert_many(backup.rolling_stock)
        if backup.decoders:
            await db.decoders.insert_many(backup.decoders)
        if backup.sound_projects:
            await db.sound_projects.insert_many(backup.sound_projects)
        
        return {
            "message": "Backup restaurado correctamente",
            "restored": {
                "locomotives": len(backup.locomotives),
                "rolling_stock": len(backup.rolling_stock),
                "decoders": len(backup.decoders),
                "sound_projects": len(backup.sound_projects)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al restaurar backup: {str(e)}")

# ============== JMRI IMPORT ENDPOINT ==============

import xml.etree.ElementTree as ET
import re

class JMRIImportResult(BaseModel):
    success: bool
    imported_count: int
    skipped_count: int
    errors: List[str]
    locomotives: List[dict]

def parse_jmri_xml(xml_content: str) -> dict:
    """Parse JMRI locomotive XML and extract relevant data"""
    try:
        root = ET.fromstring(xml_content)
        loco_elem = root.find('locomotive')
        
        if loco_elem is None:
            return None
        
        # Extract basic info from locomotive attributes
        # CORRECTED MAPPING:
        # - XML 'model' attribute (e.g., "HN2351") -> app 'reference' field
        # - XML 'roadName' attribute (e.g., "Ferrobus.591.500") -> app 'model' field
        mfg = loco_elem.get('mfg', '')
        xml_model = loco_elem.get('model', '')  # This is the reference (e.g., HN2351)
        road_name = loco_elem.get('roadName', '')  # This is the model name (e.g., Ferrobus.591.500)
        road_number = loco_elem.get('roadNumber', '')
        dcc_address = loco_elem.get('dccAddress', '3')
        comment = loco_elem.get('comment', '')
        
        # Extract decoder info
        decoder_elem = loco_elem.find('decoder')
        decoder_brand = ''
        decoder_model = ''
        decoder_family = ''
        if decoder_elem is not None:
            decoder_family = decoder_elem.get('family', '')
            decoder_model = decoder_elem.get('model', '')
            # Extract brand from family (e.g., "ESU LokSound 5 DCC" -> "ESU")
            if decoder_family:
                parts = decoder_family.split(' ')
                if parts:
                    decoder_brand = parts[0]
        
        # Extract Project Loco Name from varValue items
        # Look in decoderDef section for varValue items
        project_name = ''
        project_type = ''
        decoder_def = loco_elem.find('.//decoderDef')
        if decoder_def is not None:
            for var in decoder_def.findall('varValue'):
                item = var.get('item', '')
                value = var.get('value', '')
                if item == 'Project Loco Name':
                    project_name = value
                elif item == 'Project Loco Type':
                    project_type = value
        
        # Also check in values section (after decoderDef closes)
        # The Project Loco Name might be stored as ASCII values in CVs 1.0.261-1.0.288
        values_elem = loco_elem.find('values')
        if values_elem is not None and not project_name:
            # Try to extract project name from CV values (1.0.261-1.0.288 are ASCII chars)
            project_chars = []
            for cv_elem in values_elem.findall('CVvalue'):
                cv_name = cv_elem.get('name', '')
                cv_value = cv_elem.get('value', '')
                if cv_name.startswith('1.0.') and cv_value.isdigit():
                    cv_index = cv_name.split('.')[-1]
                    if cv_index.isdigit():
                        idx = int(cv_index)
                        if 261 <= idx <= 288:
                            char_val = int(cv_value)
                            if char_val > 0:
                                project_chars.append((idx, chr(char_val)))
            if project_chars:
                project_chars.sort(key=lambda x: x[0])
                project_name = ''.join([c[1] for c in project_chars]).strip()
        
        # Extract function labels from functionlabels element
        functions = []
        func_labels = loco_elem.find('functionlabels')
        if func_labels is not None:
            for func_label in func_labels.findall('functionlabel'):
                num = func_label.get('num', '')
                lockable = func_label.get('lockable', 'false')
                label_text = func_label.text or ''
                if num and label_text:
                    functions.append({
                        'function_number': f'F{num}',
                        'description': label_text,
                        'is_sound': False  # Will be updated based on soundlabel
                    })
        
        # Extract sound labels from soundlabels element
        sound_labels = loco_elem.find('soundlabels')
        if sound_labels is not None:
            for sound_label in sound_labels.findall('soundlabel'):
                num = sound_label.get('num', '')
                label_text = sound_label.text or ''
                if num and label_text:
                    # Mark corresponding function as sound
                    for func in functions:
                        if func['function_number'] == f'F{num}':
                            func['is_sound'] = True
                            break
                    else:
                        # Add as new function if not found
                        functions.append({
                            'function_number': f'F{num}',
                            'description': label_text,
                            'is_sound': True
                        })
        
        # Extract CV values
        cv_modifications = []
        if values_elem is not None:
            # Get important CVs only (not all the ESU function mapping)
            important_cvs = {
                '1': 'Dirección corta',
                '2': 'Vstart',
                '3': 'Aceleración',
                '4': 'Deceleración',
                '5': 'Vmax',
                '6': 'Vmedia',
                '29': 'Configuración',
                '17': 'Dirección larga (alta)',
                '18': 'Dirección larga (baja)',
            }
            for cv_elem in values_elem.findall('CVvalue'):
                cv_name = cv_elem.get('name', '')
                cv_value = cv_elem.get('value', '')
                # Only include simple CVs (not indexed ones like 16.2.xxx)
                if cv_name and '.' not in cv_name and cv_name in important_cvs:
                    try:
                        cv_modifications.append({
                            'cv_number': int(cv_name),
                            'value': int(cv_value),
                            'description': important_cvs.get(cv_name, f'CV{cv_name}')
                        })
                    except ValueError:
                        pass
        
        # Determine locomotive type based on project name or road name
        loco_type = 'diesel'  # default
        name_lower = (road_name + ' ' + project_name).lower()
        if any(x in name_lower for x in ['electric', 'eléctric', '252', '269', '251', 'ave', 'alta velocidad']):
            loco_type = 'electrica'
        elif any(x in name_lower for x in ['vapor', 'steam', '141', '240', '030']):
            loco_type = 'vapor'
        elif any(x in name_lower for x in ['automotor', 'dmu', 'emu', '592', '594', '596', 'ferrobus']):
            loco_type = 'automotor'
        elif any(x in name_lower for x in ['ave', 's-100', 's-102', 's-103', 'talgo', 'alta velocidad']):
            loco_type = 'alta_velocidad'
        
        # Build sound project name from decoder info and project name
        sound_project = ''
        if decoder_brand and project_name:
            sound_project = f"{decoder_brand} - {project_name}"
        elif project_name:
            sound_project = project_name
        elif decoder_family:
            sound_project = decoder_family
        
        return {
            'brand': mfg,
            'model': road_name or project_name,  # roadName goes to model
            'reference': xml_model,  # XML model attribute goes to reference
            'locomotive_type': loco_type,
            'paint_scheme': '',
            'registration_number': road_number,
            'prototype_type': project_name or project_type,
            'dcc_address': int(dcc_address) if dcc_address.isdigit() else 3,
            'decoder_brand': decoder_brand,
            'decoder_model': decoder_model,
            'sound_project': sound_project,
            'notes': comment,
            'cv_modifications': cv_modifications,
            'condition': 'nuevo',
            'functions': functions,
        }
    except ET.ParseError as e:
        raise ValueError(f"Error parsing XML: {str(e)}")

@api_router.post("/import/jmri", response_model=JMRIImportResult)
async def import_jmri(files_content: List[str]):
    """Import locomotives from JMRI XML files"""
    imported = []
    skipped = 0
    errors = []
    
    for i, xml_content in enumerate(files_content):
        try:
            loco_data = parse_jmri_xml(xml_content)
            if loco_data:
                # Create locomotive
                loco_obj = Locomotive(**loco_data)
                doc = loco_obj.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                doc['updated_at'] = doc['updated_at'].isoformat()
                await db.locomotives.insert_one(doc)
                imported.append({
                    'brand': loco_data['brand'],
                    'model': loco_data['model'],
                    'dcc_address': loco_data['dcc_address']
                })
            else:
                skipped += 1
                errors.append(f"Archivo {i+1}: No se encontró elemento locomotive")
        except Exception as e:
            skipped += 1
            errors.append(f"Archivo {i+1}: {str(e)}")
    
    # Record in backup history
    if imported:
        history_entry = BackupHistoryEntry(
            type="jmri_import",
            locomotives_count=len(imported),
            rolling_stock_count=0,
            decoders_count=0,
            sound_projects_count=0
        )
        history_doc = history_entry.model_dump()
        history_doc['created_at'] = history_doc['created_at'].isoformat()
        await db.backup_history.insert_one(history_doc)
    
    return JMRIImportResult(
        success=len(imported) > 0,
        imported_count=len(imported),
        skipped_count=skipped,
        errors=errors,
        locomotives=imported
    )

# ============== WISHLIST ENDPOINTS ==============

@api_router.get("/wishlist", response_model=List[WishlistItem])
async def get_wishlist():
    items = await db.wishlist.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('updated_at'), str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return items

@api_router.get("/wishlist/{item_id}", response_model=WishlistItem)
async def get_wishlist_item(item_id: str):
    item = await db.wishlist.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return item

@api_router.post("/wishlist", response_model=WishlistItem)
async def create_wishlist_item(item: WishlistItemCreate):
    item_dict = item.model_dump()
    item_obj = WishlistItem(**item_dict)
    doc = item_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.wishlist.insert_one(doc)
    return item_obj

@api_router.put("/wishlist/{item_id}", response_model=WishlistItem)
async def update_wishlist_item(item_id: str, item: WishlistItemCreate):
    existing = await db.wishlist.find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    update_data = item.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_data['id'] = item_id
    update_data['created_at'] = existing.get('created_at', datetime.now(timezone.utc).isoformat())
    
    await db.wishlist.update_one({"id": item_id}, {"$set": update_data})
    
    updated = await db.wishlist.find_one({"id": item_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return updated

@api_router.delete("/wishlist/{item_id}")
async def delete_wishlist_item(item_id: str):
    result = await db.wishlist.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return {"message": "Item eliminado"}

@api_router.post("/wishlist/{item_id}/move-to-collection")
async def move_wishlist_to_collection(item_id: str, purchase_date: Optional[str] = None, price: Optional[float] = None):
    """Move a wishlist item to the collection (create locomotive or rolling stock)"""
    item = await db.wishlist.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    
    actual_price = price if price is not None else item.get('estimated_price')
    actual_date = purchase_date or datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    if item.get('item_type') == 'locomotora':
        loco_data = {
            'brand': item.get('brand', ''),
            'model': item.get('model', ''),
            'reference': item.get('reference', ''),
            'locomotive_type': 'diesel',
            'dcc_address': 3,
            'purchase_date': actual_date,
            'price': actual_price,
            'condition': 'nuevo',
            'notes': f"Desde lista de deseos. {item.get('notes', '')}".strip(),
        }
        loco_obj = Locomotive(**loco_data)
        doc = loco_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.locomotives.insert_one(doc)
        created_id = loco_obj.id
        collection_type = 'locomotora'
    else:
        stock_data = {
            'brand': item.get('brand', ''),
            'model': item.get('model', ''),
            'reference': item.get('reference', ''),
            'stock_type': 'vagon_mercancias' if item.get('item_type') == 'vagon' else 'otro',
            'purchase_date': actual_date,
            'price': actual_price,
            'condition': 'nuevo',
            'notes': f"Desde lista de deseos. {item.get('notes', '')}".strip(),
        }
        stock_obj = RollingStock(**stock_data)
        doc = stock_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.rolling_stock.insert_one(doc)
        created_id = stock_obj.id
        collection_type = 'material_rodante'
    
    # Delete from wishlist
    await db.wishlist.delete_one({"id": item_id})
    
    return {
        "message": "Item movido a la colección",
        "collection_type": collection_type,
        "created_id": created_id
    }

# ============== PDF EXPORT ENDPOINTS ==============
from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.units import mm, cm

@api_router.get("/export/catalog/pdf")
async def export_catalog_pdf():
    """Export complete catalog (locomotives and rolling stock) to PDF"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1*cm, leftMargin=1*cm, topMargin=1*cm, bottomMargin=1*cm)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, spaceAfter=20, alignment=1)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Heading2'], fontSize=14, spaceAfter=10)
    
    # Title
    elements.append(Paragraph("Catálogo de Colección Ferroviaria", title_style))
    elements.append(Paragraph(f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Locomotives section
    locomotives = await db.locomotives.find({}, {"_id": 0}).to_list(1000)
    if locomotives:
        elements.append(Paragraph(f"Locomotoras ({len(locomotives)})", subtitle_style))
        
        # Table data
        table_data = [['Marca', 'Modelo', 'Ref.', 'Tipo', 'DCC', 'Decoder', 'Precio']]
        for loco in locomotives:
            table_data.append([
                loco.get('brand', '')[:15],
                loco.get('model', '')[:20],
                loco.get('reference', '')[:12],
                loco.get('locomotive_type', '')[:10],
                str(loco.get('dcc_address', '')),
                f"{loco.get('decoder_brand', '')} {loco.get('decoder_model', '')}"[:15],
                f"{loco.get('price', 0) or 0:.2f}€"
            ])
        
        table = Table(table_data, colWidths=[2.5*cm, 4*cm, 2.5*cm, 2*cm, 1.2*cm, 3*cm, 2*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))
    
    # Rolling Stock section
    rolling_stock = await db.rolling_stock.find({}, {"_id": 0}).to_list(1000)
    if rolling_stock:
        elements.append(Paragraph(f"Material Rodante ({len(rolling_stock)})", subtitle_style))
        
        table_data = [['Marca', 'Modelo', 'Referencia', 'Tipo', 'Era', 'Precio']]
        for stock in rolling_stock:
            table_data.append([
                stock.get('brand', '')[:15],
                stock.get('model', '')[:25],
                stock.get('reference', '')[:15],
                stock.get('stock_type', '')[:15],
                stock.get('era', '')[:8],
                f"{stock.get('price', 0) or 0:.2f}€"
            ])
        
        table = Table(table_data, colWidths=[3*cm, 5*cm, 3*cm, 3*cm, 1.5*cm, 2*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))
    
    # Summary
    total_locos = sum(loco.get('price', 0) or 0 for loco in locomotives)
    total_stock = sum(s.get('price', 0) or 0 for s in rolling_stock)
    
    elements.append(Paragraph("Resumen", subtitle_style))
    summary_data = [
        ['Concepto', 'Cantidad', 'Valor'],
        ['Locomotoras', str(len(locomotives)), f"{total_locos:.2f}€"],
        ['Material Rodante', str(len(rolling_stock)), f"{total_stock:.2f}€"],
        ['TOTAL', str(len(locomotives) + len(rolling_stock)), f"{total_locos + total_stock:.2f}€"],
    ]
    summary_table = Table(summary_data, colWidths=[6*cm, 3*cm, 3*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('BACKGROUND', (0, -1), (-1, -1), colors.lightblue),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))
    elements.append(summary_table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=catalogo_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )

@api_router.get("/export/locomotive/{locomotive_id}/pdf")
async def export_locomotive_pdf(locomotive_id: str):
    """Export individual locomotive data sheet to PDF"""
    loco = await db.locomotives.find_one({"id": locomotive_id}, {"_id": 0})
    if not loco:
        raise HTTPException(status_code=404, detail="Locomotora no encontrada")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, spaceAfter=10, alignment=1)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=12, spaceBefore=15, spaceAfter=8, textColor=colors.darkblue)
    
    # Title
    elements.append(Paragraph(f"Ficha de Locomotora", title_style))
    elements.append(Paragraph(f"{loco.get('brand', '')} - {loco.get('model', '')}", title_style))
    elements.append(Spacer(1, 15))
    
    # Basic Info
    elements.append(Paragraph("Información General", section_style))
    info_data = [
        ['Marca:', loco.get('brand', '-'), 'Modelo:', loco.get('model', '-')],
        ['Referencia:', loco.get('reference', '-'), 'Tipo:', loco.get('locomotive_type', '-')],
        ['Matrícula:', loco.get('registration_number', '-'), 'Era:', loco.get('era', '-')],
        ['Compañía:', loco.get('railway_company', '-'), 'Estado:', loco.get('condition', '-')],
        ['Fecha Compra:', loco.get('purchase_date', '-'), 'Precio:', f"{loco.get('price', 0) or 0:.2f}€"],
    ]
    info_table = Table(info_data, colWidths=[3*cm, 5*cm, 3*cm, 5*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    
    # DCC Section
    elements.append(Paragraph("Configuración Digital (DCC)", section_style))
    dcc_data = [
        ['Dirección DCC:', str(loco.get('dcc_address', 3))],
        ['Decoder:', f"{loco.get('decoder_brand', '-')} {loco.get('decoder_model', '-')}"],
        ['Proyecto Sonido:', loco.get('sound_project', '-')],
    ]
    dcc_table = Table(dcc_data, colWidths=[4*cm, 12*cm])
    dcc_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(dcc_table)
    
    # Functions
    functions = loco.get('functions', [])
    if functions:
        elements.append(Paragraph("Funciones Programadas", section_style))
        func_data = [['Función', 'Descripción', 'Sonido']]
        for func in functions:
            func_data.append([
                func.get('function_number', ''),
                func.get('description', ''),
                'Sí' if func.get('is_sound') else 'No'
            ])
        func_table = Table(func_data, colWidths=[2.5*cm, 10*cm, 2*cm])
        func_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ]))
        elements.append(func_table)
    
    # CV Modifications
    cvs = loco.get('cv_modifications', [])
    if cvs:
        elements.append(Paragraph("CVs Modificados", section_style))
        cv_data = [['CV', 'Valor', 'Descripción']]
        for cv in cvs:
            cv_data.append([
                str(cv.get('cv_number', '')),
                str(cv.get('value', '')),
                cv.get('description', '')
            ])
        cv_table = Table(cv_data, colWidths=[2*cm, 2*cm, 10*cm])
        cv_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ALIGN', (0, 0), (1, -1), 'CENTER'),
        ]))
        elements.append(cv_table)
    
    # Notes
    if loco.get('notes'):
        elements.append(Paragraph("Notas", section_style))
        elements.append(Paragraph(loco.get('notes', ''), styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"locomotora_{loco.get('reference', 'sin_ref')}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.get("/export/rolling-stock/{stock_id}/pdf")
async def export_rolling_stock_pdf(stock_id: str):
    """Export individual rolling stock data sheet to PDF"""
    stock = await db.rolling_stock.find_one({"id": stock_id}, {"_id": 0})
    if not stock:
        raise HTTPException(status_code=404, detail="Material rodante no encontrado")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    elements = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, spaceAfter=10, alignment=1)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=12, spaceBefore=15, spaceAfter=8, textColor=colors.darkgreen)
    
    # Title
    elements.append(Paragraph(f"Ficha de Material Rodante", title_style))
    elements.append(Paragraph(f"{stock.get('brand', '')} - {stock.get('model', '')}", title_style))
    elements.append(Spacer(1, 15))
    
    # Basic Info
    elements.append(Paragraph("Información General", section_style))
    info_data = [
        ['Marca:', stock.get('brand', '-'), 'Modelo:', stock.get('model', '-')],
        ['Referencia:', stock.get('reference', '-'), 'Tipo:', stock.get('stock_type', '-')],
        ['Era:', stock.get('era', '-'), 'Compañía:', stock.get('railway_company', '-')],
        ['Estado:', stock.get('condition', '-'), 'Fecha Compra:', stock.get('purchase_date', '-')],
        ['Precio:', f"{stock.get('price', 0) or 0:.2f}€", '', ''],
    ]
    info_table = Table(info_data, colWidths=[3*cm, 5*cm, 3*cm, 5*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    
    # Notes
    if stock.get('notes'):
        elements.append(Paragraph("Notas", section_style))
        elements.append(Paragraph(stock.get('notes', ''), styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"material_{stock.get('reference', 'sin_ref')}_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
