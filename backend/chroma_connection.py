import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from fastapi import Depends
from dotenv import load_dotenv
import os

load_dotenv()

_client: ClientAPI | None = None
_collection: Collection | None = None

def get_chroma_client() -> ClientAPI:
	global _client
	if _client is None:
		_client = chromadb.CloudClient(
            api_key=os.getenv("CHROMA_API_KEY"),
            tenant=os.getenv("CHROMA_TENANT"),
            database=os.getenv("CHROMA_DATABASE")
        )
	return _client

def get_chroma_collection(client: ClientAPI = Depends(get_chroma_client)) -> Collection:
	global _collection
	if _collection is None:
		_collection = client.get_or_create_collection(
		    name="my_collection",
		)
	return _collection
"""
def main():
	# Initialize ChromaDB client and collection
	client = get_chroma_client()
	collection = get_chroma_collection(client)

	# Demo documents to upload
	documents = [
		"ChromaDB is an open-source embedding database.",
		"FastAPI is a modern Python web framework.",
		"Python-dotenv loads environment variables from .env files."
	]
	ids = ["doc1", "doc2", "doc3"]
	

	# Upload documents
	print("Uploading documents...")
	collection.add(documents=documents, ids=ids)
	print("Documents uploaded.")

	# Retrieve documents (demo: query for a keyword)
	query = "modern Python variables files"
	print(f"\nQuerying for: '{query}'")
	results = collection.query(query_texts=[query], n_results=2)
	print("Results:")
	for doc, score in zip(results["documents"], results["distances"]):
		print(f"Doc: {doc[0]} | Score: {score[0]}")
		print(f"Doc: {doc[1]} | Score: {score[1]}")
		print(len(doc))


if __name__ == "__main__":
	main()
"""
