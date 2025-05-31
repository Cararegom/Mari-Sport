
-- Tabla: productos
create table if not exists productos (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    descripcion text,
    categoria text,
    talla text,
    color text,
    precio numeric not null,
    stock integer not null default 0,
    imagen_url text,
    creado_en timestamp default now()
);

-- Tabla: clientes
create table if not exists clientes (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    telefono text,
    direccion text,
    creado_en timestamp default now()
);

-- Tabla: ventas_fiadas
create table if not exists ventas_fiadas (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid references clientes(id) on delete cascade,
    productos text not null,
    total numeric not null,
    abono_inicial numeric default 0,
    saldo_pendiente numeric not null,
    fecha_inicio date not null,
    fecha_limite date,
    estado text default 'pendiente',
    creado_en timestamp default now()
);

-- Tabla: abonos
create table if not exists abonos (
    id uuid primary key default gen_random_uuid(),
    venta_id uuid references ventas_fiadas(id) on delete cascade,
    monto numeric not null,
    fecha_abono date default current_date,
    creado_en timestamp default now()
);
