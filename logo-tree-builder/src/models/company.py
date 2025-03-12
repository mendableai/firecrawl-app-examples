from pydantic import BaseModel, Field
import json
from urllib.parse import urlparse


class Company:
    """Represents a company with its client information."""

    def __init__(self, name=None, website_url=None):
        self.name = name
        self.website_url = website_url
        self.clients = []  # List of Company objects that are clients
        self.client_of = None  # Company object that this company is a client of

    def add_client(self, client):
        """
        Add a client to this company.

        Normalizes the client's URL to prevent duplicates with different URL formats.
        """
        # Normalize the client's URL first
        if client.website_url:
            client.website_url = self._normalize_url(client.website_url)

        # Check if this client is already in our list (using normalized URL comparison)
        if client not in self.clients:
            self.clients.append(client)
            client.client_of = self  # Update the bidirectional relationship

    def to_dict(self):
        """Convert the company to a dictionary for visualization."""
        return {
            "name": self.name,
            "website_url": self.website_url,
            "clients": [client.to_dict() for client in self.clients],
            "disclaimer": "Note: Different websites use different URL structures for client references. For example, platforms like Hugging Face (huggingface.co/client) use path-based URLs, while others use direct domain links (client.com). This may cause duplicate node labels or cyclical connections in the visualization.",
        }

    def to_json(self, indent=2):
        """Convert the company tree to a JSON string."""
        return json.dumps(self.to_dict(), indent=indent)

    def to_flat_list(self):
        """Convert the company tree to a flat list of all companies."""
        companies = [{"name": self.name, "website_url": self.website_url}]
        for client in self.clients:
            companies.extend(client.to_flat_list())
        return companies

    def _normalize_url(self, url):
        """
        Normalize a URL to ensure consistent comparison.

        Handles variations like:
        - Adding scheme if missing
        - Normalizes domain with or without www
        - Removes trailing slash
        """
        if not url:
            return url

        # Add scheme if missing
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        # Parse the URL
        parsed_url = urlparse(url)

        # Normalize domain (remove www. if present)
        netloc = parsed_url.netloc
        if netloc.startswith("www."):
            netloc = netloc[4:]

        # Rebuild the URL with normalized domain and without trailing slash
        path = parsed_url.path
        if path.endswith("/"):
            path = path[:-1]

        # Rebuild the URL
        normalized = f"{parsed_url.scheme}://{netloc}{path}"

        # Add query and fragment if they exist
        if parsed_url.query:
            normalized += f"?{parsed_url.query}"
        if parsed_url.fragment:
            normalized += f"#{parsed_url.fragment}"

        return normalized

    def __eq__(self, other):
        """Two companies are equal if they have the same normalized website URL."""
        if not isinstance(other, Company):
            return False

        # Normalize both URLs before comparison
        self_url = self._normalize_url(self.website_url)
        other_url = self._normalize_url(other.website_url)

        return self_url == other_url

    def __str__(self):
        return f"{self.name} - {self.website_url}"

    def __repr__(self):
        return f"Company(name='{self.name}', website_url='{self.website_url}', ...)"


class CompanySchema(BaseModel):
    """Schema for a company with its website URL."""

    name: str = Field(description="The name of the company")
    website_url: str = Field(description="The website URL of the company")


class ClientsSchema(BaseModel):
    """Schema for a list of clients of a company."""

    clients: list[CompanySchema] = Field(description="A list of clients of the company")
