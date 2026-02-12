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
    total_value: float
    locomotives_by_brand: Dict[str, int]
    locomotives_by_company: Dict[str, int]
    locomotives_by_condition: Dict[str, int]
    locomotives_by_decoder: Dict[str, int]
    locomotives_by_type: Dict[str, int]
    rolling_stock_by_type: Dict[str, int]

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
    
    return StatsResponse(
        total_locomotives=len(locomotives),
        total_rolling_stock=len(rolling_stock),
        total_decoders=len(decoders),
        total_sound_projects=len(sound_projects),
        total_value=total_value,
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
        mfg = loco_elem.get('mfg', '')
        road_name = loco_elem.get('roadName', '')
        road_number = loco_elem.get('roadNumber', '')
        dcc_address = loco_elem.get('dccAddress', '3')
        comment = loco_elem.get('comment', '')
        
        # Extract decoder info
        decoder_elem = loco_elem.find('decoder')
        decoder_brand = ''
        decoder_model = ''
        if decoder_elem is not None:
            decoder_family = decoder_elem.get('family', '')
            decoder_model = decoder_elem.get('model', '')
            # Extract brand from family (e.g., "ESU LokPilot V4.0" -> "ESU")
            if decoder_family:
                parts = decoder_family.split(' ')
                if parts:
                    decoder_brand = parts[0]
        
        # Extract Project Loco Name and Type from varValue
        project_name = ''
        project_type = ''
        values_elem = loco_elem.find('.//decoderDef')
        if values_elem is not None:
            for var in values_elem.findall('varValue'):
                item = var.get('item', '')
                value = var.get('value', '')
                if item == 'Project Loco Name':
                    project_name = value
                elif item == 'Project Loco Type':
                    project_type = value
        
        # Extract CV values
        cv_modifications = []
        cv_values_elem = loco_elem.find('values')
        if cv_values_elem is not None:
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
            for cv_elem in cv_values_elem.findall('CVvalue'):
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
        elif any(x in name_lower for x in ['automotor', 'dmu', 'emu', '592', '594', '596']):
            loco_type = 'automotor'
        elif any(x in name_lower for x in ['ave', 's-100', 's-102', 's-103', 'talgo', 'alta velocidad']):
            loco_type = 'alta_velocidad'
        
        return {
            'brand': mfg,
            'model': road_name or project_name,
            'reference': '',  # Not available in JMRI
            'locomotive_type': loco_type,
            'paint_scheme': '',
            'registration_number': road_number,
            'prototype_type': project_name,
            'dcc_address': int(dcc_address) if dcc_address.isdigit() else 3,
            'decoder_brand': decoder_brand,
            'decoder_model': decoder_model,
            'sound_project': project_name if decoder_brand else '',
            'notes': comment,
            'cv_modifications': cv_modifications,
            'condition': 'nuevo',
            'functions': [],
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
