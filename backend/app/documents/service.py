import uuid
from pathlib import Path

from fastapi import UploadFile

from app.documents.exceptions import InvalidDocumentTypeError, MissingFilenameError
from app.documents.models import DocumentRecord
from app.documents.repository import DocumentRepository

PROJECT_DIR = Path(__file__).parents[2]

class DocumentService:
    def __init__(
        self, *, repository: DocumentRepository, upload_dir: Path, allowed_mime_types: set, allowed_extensions: set
    ) -> None:
        self.repository = repository
        self.upload_dir = upload_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.allowed_mime_types = allowed_mime_types
        self.allowed_extensions = allowed_extensions

    async def upload_document(self, file: UploadFile, doc_id: uuid.UUID, user_id: uuid.UUID) -> DocumentRecord:
        if not file.filename:
            raise MissingFilenameError()
        
        is_valid_mime = file.content_type in self.allowed_mime_types
        is_valid_extension = file.filename.lower().endswith(tuple(self.allowed_extensions))
        
        if not (is_valid_mime and is_valid_extension):
            raise InvalidDocumentTypeError(
                content_type=file.content_type, 
                filename=file.filename
            )
        
        ext = Path(file.filename).suffix.lower()
        file_name = f"{uuid.uuid4()}{ext}"
        absolute_file_path = self.upload_dir / file_name
        relative_file_path = absolute_file_path.relative_to(PROJECT_DIR)
        
        content = await file.read()
        absolute_file_path.write_bytes(content)
            
        document = await self.repository.create_processing_document(
            id=doc_id, user_id=user_id, original_filename=file.filename, file_path=str(relative_file_path)
        )

        return document
