.PHONY: run dev test lint format typecheck migrate migration seed worker docker-up audit install

install:
	pip install -e ".[dev]"

run:
	uvicorn app.main:app --host 0.0.0.0 --port 8000

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v --cov=app --cov-report=term-missing

test-fast:
	pytest tests/ -x -q

lint:
	ruff check app/ tests/

format:
	ruff format app/ tests/

typecheck:
	mypy app/

migrate:
	alembic upgrade head

migration:
	alembic revision --autogenerate -m "$(MSG)"

downgrade:
	alembic downgrade -1

seed:
	python scripts/seed_dev.py

superadmin:
	python scripts/create_superadmin.py

keys:
	python scripts/generate_rsa_keys.py

worker:
	python -m arq app.core.tasks.worker.WorkerSettings

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

audit:
	pip-audit
