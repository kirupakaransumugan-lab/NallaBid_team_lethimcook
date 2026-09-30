from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_SSL: bool = False

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    FRONTEND_URL: str = "http://localhost:5173"

    # Comma-separated login emails that get the admin panel. Admin is decided here,
    # not in the database, so the users.role column stays BUYER/SUPPLIER.
    ADMIN_EMAILS: str = ""

    @property
    def admin_emails(self) -> set[str]:
        return {email.strip().lower() for email in self.ADMIN_EMAILS.split(",") if email.strip()}

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


settings = Settings()