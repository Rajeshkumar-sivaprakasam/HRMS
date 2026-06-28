from pydantic import BaseModel, ConfigDict, EmailStr


class OrganisationUpdateRequest(BaseModel):
    name: str | None = None
    legal_name: str | None = None
    gstin: str | None = None
    pan: str | None = None
    cin: str | None = None
    pf_registration_number: str | None = None
    esi_registration_number: str | None = None
    website: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    address_line3: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    country: str | None = None
    tin: str | None = None
    financial_year_start_month: int | None = None
    payroll_cycle_day: int | None = None
    is_pf_applicable: bool | None = None
    is_esi_applicable: bool | None = None
    is_professional_tax_applicable: bool | None = None


class OrganisationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    legal_name: str | None
    gstin: str | None
    pan: str | None
    cin: str | None
    pf_registration_number: str | None
    esi_registration_number: str | None
    website: str | None
    email: str | None
    phone: str | None
    address_line1: str | None
    address_line2: str | None
    address_line3: str | None
    city: str | None
    state: str | None
    pincode: str | None
    country: str
    logo_url: str | None
    tin: str | None
    financial_year_start_month: int
    payroll_cycle_day: int
    is_pf_applicable: bool
    is_esi_applicable: bool
    is_professional_tax_applicable: bool
