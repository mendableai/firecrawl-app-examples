from pydantic import BaseModel
from typing import List, Optional


class CompanyData(BaseModel):
    name: str
    about: Optional[str]
    employee_count: Optional[str]
    financing_type: Optional[str]
    industries: List[str] = []
    headquarters: List[str] = []
    founders: List[str] = []
    founded_date: Optional[str]
    operating_status: Optional[str]
    legal_name: Optional[str]
    stock_symbol: Optional[str]
    acquisitions: List[str] = []
    investments: List[str] = []
    exits: List[str] = []
    total_funding: Optional[str]
    contacts: List[str] = []
