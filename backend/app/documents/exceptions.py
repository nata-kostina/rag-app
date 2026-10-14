class InvalidDocumentTypeError(Exception):
    def __init__(self, content_type: str | None, filename: str | None) -> None:
        self.content_type = content_type
        self.filename = filename
        super().__init__(
            f"Unsupported file type: MIME='{content_type}', filename='{filename}'. "
            "Only PDF documents are allowed."
        )
        
class MissingFilenameError(Exception):
    def __init__(self) -> None:
        super().__init__("Uploaded file must have a filename.")