# 🚀 Guía de Despliegue en Producción — LUUP Frontend

> Guía manual paso a paso. Sin scripts. Lista para copiar y pegar.

---

## 🔌 DATOS DE CONEXIÓN

| Campo            | Valor                    |
|------------------|--------------------------|
| **IP**           | `160.153.186.158`        |
| **Usuario**      | `rootluup`               |
| **Puerto**       | `22`                     |
| **Ruta en VPS**  | `/var/www/web_luup`      |

---

## PASO 1 — Preparación Local

### 1.1 Generar el build de producción

Desde la raíz del proyecto, ejecuta:

```bash
npm run build
```

Esto genera la carpeta `dist/` con todos los archivos estáticos optimizados.

### 1.2 Comprimir la carpeta dist

**En Windows (PowerShell):**

```powershell
Compress-Archive -Path dist -DestinationPath dist.zip
```

**En Mac / Linux:**

```bash
zip -r dist.zip dist/
```

Al terminar tendrás `dist.zip` listo para subir.

---

## PASO 2 — Transferencia por SFTP (FileZilla)

### 2.1 Conectarse al servidor

En la **barra de conexión rápida** de FileZilla rellena los campos así:

| Campo               | Valor                    |
|---------------------|--------------------------|
| **Servidor**        | `sftp://160.153.186.158` |
| **Nombre de usuario** | `rootluup`             |
| **Contraseña**      | `(tu contraseña SSH)`    |
| **Puerto**          | `22`                     |

> ⚠️ Escribe `sftp://` antes de la IP. Sin ese prefijo FileZilla intentará FTP normal y fallará.

### 2.2 Subir el archivo

1. Panel izquierdo (local): navega hasta donde está tu `dist.zip`.
2. Panel derecho (servidor): **déjalo en la carpeta que se abre por defecto** al conectar (`/home/rootluup` o `~`). No necesitas navegar a ningún otro lugar.
3. Arrastra `dist.zip` al panel derecho.
4. Espera a que la transferencia llegue al **100%** antes de cerrar FileZilla.

> El archivo quedará en `~/dist.zip`. Lo moveremos a la carpeta correcta desde la terminal en el siguiente paso.

---

## PASO 3 — Comandos en la Terminal del VPS

Ejecuta los comandos **en este orden**, uno a la vez.

### 3.1 Conectarse al servidor por SSH

```bash
ssh rootluup@160.153.186.158
```

### 3.2 Mover dist.zip a la carpeta del frontend

```bash
sudo mv ~/dist.zip /var/www/web_luup/
```

> Mueve el archivo desde donde FileZilla lo dejó (`~`) hasta la carpeta de Nginx.

### 3.3 Ir a la carpeta del frontend

```bash
cd /var/www/web_luup
```

### 3.4 Verificar que dist.zip está ahí

```bash
ls -lh
```

Debes ver `dist.zip` en el listado antes de continuar.

### 3.5 Borrar los archivos viejos (conservando dist.zip)

```bash
sudo find . -mindepth 1 -not -name 'dist.zip' -delete
```

> Estando dentro de `/var/www/web_luup`, este comando elimina todo el contenido antiguo **sin borrar** el `dist.zip`.

### 3.6 Descomprimir el archivo

```bash
sudo unzip dist.zip
```

Esto crea la subcarpeta `dist/` dentro de `/var/www/web_luup`.

### 3.7 Mover los archivos a la raíz

```bash
sudo mv dist/* /var/www/web_luup/
```

> Vite empaqueta todo dentro de `dist/`. Este comando saca esos archivos a la raíz donde Nginx los necesita.

### 3.8 Eliminar la carpeta dist vacía y el zip sobrante

```bash
sudo rm -rf dist/
sudo rm dist.zip
```

### 3.9 Ajustar permisos

```bash
sudo chown -R www-data:www-data /var/www/web_luup
sudo chmod -R 755 /var/www/web_luup
```

### 3.10 Verificar el resultado final

```bash
ls -lh
```

Debes ver `index.html`, `assets/` y demás archivos directamente en la raíz, sin subcarpetas extra.

---

## ✅ Checklist de Verificación

- [ ] `npm run build` ejecutado sin errores
- [ ] `dist.zip` generado correctamente
- [ ] Archivo subido a `~` (home del usuario) via FileZilla
- [ ] `dist.zip` movido a `/var/www/web_luup/` desde la terminal
- [ ] Archivos viejos eliminados del servidor
- [ ] `dist.zip` descomprimido exitosamente
- [ ] Archivos movidos desde `dist/` a la raíz
- [ ] Carpeta `dist/` vacía y `dist.zip` eliminados
- [ ] Permisos ajustados (`www-data`, `755`)
- [ ] `index.html` visible en la raíz del directorio
- [ ] Sitio funcionando en el navegador ✔️
