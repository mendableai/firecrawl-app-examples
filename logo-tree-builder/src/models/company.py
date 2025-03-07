from pydantic import BaseModel, Field
import json


class Company:
    """Represents a company with its client information."""

    def __init__(self, name=None, website_url=None):
        self.name = name
        self.website_url = website_url
        self.clients = []  # List of Company objects that are clients
        self.client_of = None  # Company object that this company is a client of

    def add_client(self, client):
        """Add a client to this company."""
        if client not in self.clients:
            self.clients.append(client)
            client.client_of = self  # Update the bidirectional relationship

    def to_dict(self):
        """Convert the company to a dictionary for visualization."""
        return {
            "name": self.name,
            "website_url": self.website_url,
            "clients": [client.to_dict() for client in self.clients],
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

    def __eq__(self, other):
        """Two companies are equal if they have the same website URL."""
        if not isinstance(other, Company):
            return False
        return self.website_url == other.website_url

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
