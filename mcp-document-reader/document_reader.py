from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.prompts import base
from markitdown import MarkItDown
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("mcp-document-reader")

# Create MCP server with debugging
mcp = FastMCP("DocumentReader", dependencies=["markitdown[all]"])
md = MarkItDown()

logger.info("Starting Document Reader MCP server")


@mcp.tool()
def read_pdf(file_path: str) -> str:
    """Read a PDF file and return the text."""
    logger.info(f"Reading PDF file: {file_path}")
    # Expand the tilde (if part of the path) to the home directory path
    expanded_path = os.path.expanduser(file_path)

    return md.convert(expanded_path).text_content


@mcp.tool()
def read_docx(file_path: str) -> str:
    """Read a DOCX file and return the text."""
    logger.info(f"Reading DOCX file: {file_path}")
    expanded_path = os.path.expanduser(file_path)

    return md.convert(expanded_path).text_content


@mcp.resource("file://my-resource-name")
def always_needed_pdf():
    """Provide the contents of a PDF file as a resource."""
    logger.info("Accessing PDF resource")
    # Return the file path
    pdf_path = "file:///Users/bexgboost/Downloads/test.pdf"
    return md.convert(pdf_path).text_content


@mcp.prompt()
def debug_pdf_path(error: str) -> list[base.Message]:
    """Debug prompt for PDF issues."""
    logger.info(f"Debug prompt called with error: {error}")
    return f"I am debugging this error: {error}"


if __name__ == "__main__":
    mcp.run()
