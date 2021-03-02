if [ ! -f .env.development ]; then
  cp .env.example .env.development
fi
if [ ! -f .env.production ]; then
  cp .env.example .env.production
fi
