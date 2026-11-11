# Gestor de Citas Médicas — ESCOM IPN

Proyecto de la materia **Paradigmas de Programación** (Grupo **3CV4** — Escuela Superior de Cómputo, IPN).

> **Estado actual:** Estructura base de directorios, archivos de módulos vacíos y entorno Docker completo listo para implementar la lógica de aplicación.

---

## Stack Tecnológico

- **Backend:** Node.js 22 + Express (Arquitectura 100% Orientada a Objetos con Clases ES6)
- **Frontend:** AngularJS 1.x, HTML5 y CSS3 (servido estáticamente con Nginx)
- **Base de Datos:** MySQL 8.0
- **Orquestación:** Docker y Docker Compose

---

## Estructura del Proyecto

```text
proyecto/
├── backend/
│   ├── database/
│   │   └── schema.sql       # Script DDL inicial (se monta en MySQL al inicializar)
│   ├── src/
│   │   ├── config/          # Configuración de conexión MySQL
│   │   ├── controllers/     # Controladores por rol y citas
│   │   ├── models/          # Clases POO (Usuario, roles, AgendaMedico, CitaMedica, ConsultaMedica)
│   │   ├── routes/          # Rutas de la API REST
│   │   └── services/        # Servicios de lógica de negocio
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/              # Vistas HTML5 y hojas de estilo CSS3
│   ├── js/                  # Módulo, controladores y servicios AngularJS
│   ├── Dockerfile
│   └── index.html
├── docker-compose.yml       # Orquestación: MySQL + Backend + Frontend
└── README.md
```

### Modelo de Dominio (POO)

- **Superclase base:** `Usuario`
- **Jerarquía de roles (herencia):** `DirectorGeneral`, `AdministradorArea`, `Doctor`, `Recepcionista`, `Paciente`
- **Entidades clínicas:** `AgendaMedico`, `CitaMedica`, `ConsultaMedica`

---

## Tutorial: Cómo levantar todo el proyecto

### 1. Prerrequisitos

Asegúrate de tener instalados:

- **Git**
- **Docker** y **Docker Compose v2**
  - **Windows / macOS:** Instala [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ya incluye Docker Compose).
  - **Linux (Ubuntu/Debian):** Instala Docker Engine y el plugin `docker-compose-plugin`.

Verifica en tu terminal que funcionen correctamente:

```bash
docker --version
docker compose version
```

> **Nota:** No necesitas instalar Node.js ni MySQL localmente si vas a trabajar con Docker, ya que todo corre aislado en contenedores.

---

### 2. Clonar el repositorio y ubicarse en `proyecto/`

```bash
git clone https://github.com/Melyymix/gestor-citas-paradigmas.git
cd gestor-citas-paradigmas/proyecto
```

*(Si ya estás en la raíz del repositorio, solo entra a `cd proyecto`.)*

---

### 3. Configurar variables de entorno (opcional)

El archivo `docker-compose.yml` ya cuenta con valores por defecto funcionales, por lo que **puedes omitir este paso** si no tienes conflictos de puertos.

Si necesitas cambiar puertos (por ejemplo, si ya tienes un MySQL local en el puerto `3306`) o credenciales, crea un archivo `.env` dentro de `proyecto/` con los valores que necesites:

```env
MYSQL_ROOT_PASSWORD=root_secret
MYSQL_DATABASE=gestor_citas_medicas
MYSQL_USER=citas_user
MYSQL_PASSWORD=citas_pass
MYSQL_PORT=3306
BACKEND_PORT=3000
FRONTEND_PORT=8080
```

| Variable | Valor por defecto | Descripción |
| --- | --- | --- |
| `MYSQL_ROOT_PASSWORD` | `root_secret` | Contraseña del usuario `root` en MySQL |
| `MYSQL_DATABASE` | `gestor_citas_medicas` | Nombre de la base de datos |
| `MYSQL_USER` | `citas_user` | Usuario de aplicación para MySQL |
| `MYSQL_PASSWORD` | `citas_pass` | Contraseña del usuario de aplicación |
| `MYSQL_PORT` | `3306` | Puerto expuesto en tu máquina para MySQL |
| `BACKEND_PORT` | `3000` | Puerto expuesto para la API Node.js |
| `FRONTEND_PORT` | `8080` | Puerto expuesto para el servidor web Nginx |

---

### 4. Construir e iniciar todos los servicios

Desde `gestor-citas-paradigmas/proyecto/`:

```bash
# Construye las imágenes e inicia MySQL, Backend y Frontend (en primer plano para ver logs)
docker compose up --build
```

Si prefieres ejecutarlo en segundo plano (modo *detached*):

```bash
docker compose up -d --build
```

El orden de arranque está gestionado automáticamente:
1. Se inicia **`gestor_citas_mysql`** y se espera a que su `healthcheck` (`mysqladmin ping`) responda correctamente.
2. Se inicia **`gestor_citas_backend`** conectado a MySQL en la red interna `gestor_citas_net`.
3. Se inicia **`gestor_citas_frontend`** con Nginx sirviendo el cliente web.

---

### 5. Verificar que todo funciona

1. **Estado de los contenedores:**
   ```bash
   docker compose ps
   ```
   Debes ver los 3 servicios (`mysql`, `backend`, `frontend`) activos (`Up` / `healthy`).

2. **Frontend (Nginx + AngularJS):**
   Abre en tu navegador:
   - `http://localhost:8080`

3. **Backend (Node.js + Express):**
   Abre en tu navegador o prueba con `curl`:
   ```bash
   curl http://localhost:3000/api/health
   ```
   Respuesta esperada:
   ```json
   {"ok":true,"service":"gestor-citas-medicas-backend","status":"running"}
   ```

4. **Base de datos (MySQL 8.0):**
   Puedes entrar a la consola de MySQL dentro del contenedor con:
   ```bash
   docker exec -it gestor_citas_mysql mysql -u citas_user -pcitas_pass gestor_citas_medicas
   ```
   *(O como `root`: `docker exec -it gestor_citas_mysql mysql -u root -proot_secret`)*

---

## Flujo de Trabajo durante el Desarrollo

- **Logs en tiempo real:**
  ```bash
  docker compose logs -f
  # O solo de un servicio:
  docker compose logs -f backend
  ```
- **Cambios en Frontend (`frontend/`):** Los directorios `public/`, `js/` e `index.html` están montados en el contenedor de Nginx; solo recarga el navegador (`Ctrl + F5`).
- **Cambios en Backend (`backend/src/` o `server.js`):** Están montados como volumen en el contenedor. Reinicia el servicio para aplicar cambios en Node:
  ```bash
  docker compose restart backend
  ```
- **Si agregas librerías nuevas en `backend/package.json`:** Reconstruye la imagen del backend:
  ```bash
  docker compose up -d --build backend
  ```
- **Cuando modifiques `backend/database/schema.sql`:**
  MySQL en Docker solo ejecuta los scripts de `/docker-entrypoint-initdb.d/` la **primera vez** que se crea el volumen `mysql_data`. Si ya habías iniciado el proyecto antes de llenar `schema.sql`, recrea el volumen para aplicar el nuevo DDL desde cero:
  ```bash
  docker compose down -v
  docker compose up -d --build
  ```

---

## Comandos Rápidos de Gestión

| Acción | Comando |
| --- | --- |
| Levantar servicios (sin reconstruir) | `docker compose up -d` |
| Reconstruir y levantar | `docker compose up -d --build` |
| Detener contenedores (conserva datos de MySQL) | `docker compose down` |
| Detener y borrar volumen de MySQL (reinicio limpio) | `docker compose down -v` |
| Reiniciar solo el backend | `docker compose restart backend` |

---

## Ejecución del Backend sin Docker (Opcional)

Si necesitas correr únicamente Node.js en tu máquina local (requiere **Node.js 22+** y una instancia de MySQL disponible):

```bash
cd backend
npm install
npm run dev
```

Configura un archivo `.env` dentro de `backend/` con `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.

---

## Solución de Problemas Comunes

- **Error `port is already allocated` (puerto `3306`, `3000` u `8080` ocupado):**
  Si ya tienes MySQL u otro servicio corriendo localmente en ese puerto, crea `proyecto/.env` cambiando el puerto en conflicto (por ejemplo `MYSQL_PORT=3307` o `FRONTEND_PORT=8081`) y vuelve a ejecutar `docker compose up -d`.
- **Error de conexión a MySQL desde el backend dentro de Docker:**
  Dentro de la red de Docker, el host de la base de datos es `mysql` (nombre del servicio en `docker-compose.yml`), **no** `localhost`.
- **Permisos en Linux al ejecutar `docker`:**
  Si aparece `permission denied`, asegúrate de que tu usuario pertenezca al grupo `docker` (`sudo usermod -aG docker $USER` y reinicia tu sesión).
