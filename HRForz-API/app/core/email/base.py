from abc import ABC, abstractmethod


class EmailClient(ABC):
    @abstractmethod
    async def send(
        self,
        to_email: str,
        subject: str,
        html_content: str,
    ) -> None: ...
