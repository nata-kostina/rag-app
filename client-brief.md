# Client brief

## The company

Apex Financial Analytics is a fictional financial research and investment consulting firm. It regularly analyzes annual reports (10-K filings), financial statements, and corporate disclosures from publicly traded enterprise companies across North America and Europe.

Alex works as a senior financial analyst. Corporate filings arrive exclusively as complex, multi-page digital PDF documents. Before generating investment reports or responding to stakeholder inquiries, Alex must ingest these dense financial filings into an automated Retrieval-Augmented Generation (RAG) system to extract key financial metrics, verify performance disclosures, and perform semantic search across corporate data.

All source code, documentation, and interface text is in English.

## User story

> As a financial analyst at an investment research firm, I want to upload complex corporate financial filings (such as 10-K reports) in PDF format and query them via an AI-assisted RAG interface so I can quickly extract precise financial metrics, verify corporate data, and streamline my financial analysis workflow.

## What's included in the build

- PDF document ingestion with file upload and local storage for corporate filings (tested against the FinanceBench dataset, e.g., 10-K filings from companies like 3M, Apple, or Pfizer).
- Automated document processing pipeline using chunking, vector embeddings, and vector store storage (Qdrant) for fast semantic retrieval.
- Interactive RAG-based query system allowing users to ask natural language questions about financial metrics, revenue, and disclosures within uploaded documents.
- Source attribution for generated responses, displaying provenance metadata including the source document filename and the exact text snippet (quote) extracted from the document for verification.
- Document management system featuring a viewable list of all uploaded financial documents and their current processing statuses.
- Query history view allowing analysts to browse and inspect past questions and generated responses (read-only audit log).
- Background worker task management for document ingestion.
- Document status management (e.g., `PROCESSING`, `UPLOADED`, `FAILED`) with persistent database logging (SQLite/SQLAlchemy).
- Guided web interface flow: upload financial PDF → processing status indicator → interactive AI query workspace.