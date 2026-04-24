# Neo4j Social Network - Backend

Backend API para clon de Twitter/X usando Node.js, Express y Neo4j AuraDB.

## Estructura del Proyecto

```
backend/
├── src/
│   ├── index.js              # Entry point de Express
│   ├── config/
│   │   └── neo4j.js          # Configuración del driver Neo4j
│   ├── routes/               # Definición de rutas REST
│   ├── controllers/          # Manejo de req/res HTTP
│   ├── services/             # Lógica de negocio + Cypher queries
│   ├── middleware/           # Error handlers y validaciones
│   └── utils/                # Utilidades (CSV, conversión de tipos)
├── Dockerfile
├── package.json
└── .env
```

## Configuración

1. Crear archivo `.env` con las credenciales de Neo4j AuraDB:

```env
NEO4J_URI=neo4j+s://<aura-instance>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>
PORT=3001
```

2. Instalar dependencias:

```bash
cd backend
npm install
```

## Ejecución

### Modo desarrollo (con nodemon):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

### Con Docker:
```bash
# Desde la raíz del proyecto
docker-compose up --build
```

## Endpoints API

### Users - `/api/users`
- `POST /` - Crear usuario (1 label)
- `POST /verified` - Crear usuario verificado (2 labels)
- `GET /:id` - Obtener usuario por ID
- `GET /` - Obtener usuarios con filtros
- `GET /stats/aggregate` - Estadísticas agregadas
- `PATCH /:id/props` - Actualizar propiedades
- `DELETE /:id` - Eliminar usuario

### Posts - `/api/posts`
- `POST /` - Crear post
- `GET /:id` - Obtener post por ID
- `GET /` - Obtener posts con filtros
- `PATCH /:id` - Actualizar post
- `DELETE /:id` - Eliminar post

### Relationships - `/api/relationships`
- `POST /follow` - Seguir usuario
- `POST /like` - Dar like a post
- `POST /save` - Guardar post
- `DELETE /follow/:from/:to` - Dejar de seguir

### Admin - `/api/admin`
- `POST /seed` - Generar datos de prueba
- `POST /csv` - Cargar datos desde CSV

## Generar Datos de Prueba

```bash
node src/utils/generateFakeData.js
```

## Reglas de Desarrollo

1. **Todo el código Cypher debe estar en `services/`** - nunca en controllers o routes
2. **Siempre cerrar las sesiones de Neo4j** en bloques `finally`
3. **Usar `toNativeTypes()`** en todas las respuestas para convertir tipos Neo4j
4. **Usar `DETACH DELETE`** para eliminar nodos con relaciones
5. **Usar `MERGE`** en lugar de `CREATE` para relaciones (evitar duplicados)
6. **IDs son UUIDs** - generar con `crypto.randomUUID()`

## Tecnologías

- Node.js 18+
- Express 4.x
- Neo4j Driver 5.x
- Docker & Docker Compose
