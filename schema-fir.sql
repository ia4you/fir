--
-- Schema FIR Turel — basado en pir.turel.es (vía eir.turel.es y mir.turel.es)
-- Sin las tablas de auditoria cruzada (match_candidates, temp_estudio, temp_estudio_correctas)
-- Sin extension pg_trgm ni dblink (no se usa cruce de fuentes en FIR)
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Tabla: preguntas
--
CREATE TABLE public.preguntas (
    id integer NOT NULL,
    "año" integer NOT NULL,
    numero integer NOT NULL,
    pregunta text NOT NULL,
    opcion_a text NOT NULL,
    opcion_b text NOT NULL,
    opcion_c text NOT NULL,
    opcion_d text NOT NULL,
    opcion_e text,
    correcta character(1) NOT NULL,
    explicacion text,
    imagen_path text,
    tema text,
    explicacion_calidad text,
    subtema text,
    tema_revisar boolean DEFAULT false NOT NULL,
    tema_alternativo text,
    tema_motivo text
);

CREATE SEQUENCE public.preguntas_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.preguntas_id_seq OWNED BY public.preguntas.id;
ALTER TABLE ONLY public.preguntas ALTER COLUMN id SET DEFAULT nextval('public.preguntas_id_seq'::regclass);

--
-- Tabla: usuarios
--
CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    plan character varying(20) DEFAULT 'free'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    stripe_customer_id text,
    stripe_subscription_id text,
    terminos_aceptados boolean DEFAULT false,
    terminos_fecha timestamp without time zone,
    avatar_path text
);

CREATE SEQUENCE public.usuarios_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;
ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);

--
-- Tabla: sesiones
--
CREATE TABLE public.sesiones (
    id integer NOT NULL,
    fecha timestamp without time zone DEFAULT now(),
    modo character varying(50) NOT NULL,
    tema character varying(100),
    total_preguntas integer NOT NULL,
    aciertos integer NOT NULL,
    duracion_segundos integer,
    user_id integer NOT NULL
);

CREATE SEQUENCE public.sesiones_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.sesiones_id_seq OWNED BY public.sesiones.id;
ALTER TABLE ONLY public.sesiones ALTER COLUMN id SET DEFAULT nextval('public.sesiones_id_seq'::regclass);

--
-- Tabla: respuestas_sesion
--
CREATE TABLE public.respuestas_sesion (
    id integer NOT NULL,
    sesion_id integer,
    pregunta_id integer,
    respuesta_dada character(1),
    correcta boolean NOT NULL,
    user_id integer NOT NULL
);

CREATE SEQUENCE public.respuestas_sesion_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.respuestas_sesion_id_seq OWNED BY public.respuestas_sesion.id;
ALTER TABLE ONLY public.respuestas_sesion ALTER COLUMN id SET DEFAULT nextval('public.respuestas_sesion_id_seq'::regclass);

--
-- Tabla: blog_posts
--
CREATE TABLE public.blog_posts (
    id integer NOT NULL,
    titulo text NOT NULL,
    slug text NOT NULL,
    resumen text,
    contenido text NOT NULL,
    publicado boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    imagen_portada text
);

CREATE SEQUENCE public.blog_posts_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.blog_posts_id_seq OWNED BY public.blog_posts.id;
ALTER TABLE ONLY public.blog_posts ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_id_seq'::regclass);

--
-- Tabla: contacto
--
CREATE TABLE public.contacto (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    tipo character varying(50) NOT NULL,
    mensaje text NOT NULL,
    leido boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE public.contacto_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.contacto_id_seq OWNED BY public.contacto.id;
ALTER TABLE ONLY public.contacto ALTER COLUMN id SET DEFAULT nextval('public.contacto_id_seq'::regclass);

--
-- Tabla: lista_espera
--
CREATE TABLE public.lista_espera (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE public.lista_espera_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.lista_espera_id_seq OWNED BY public.lista_espera.id;
ALTER TABLE ONLY public.lista_espera ALTER COLUMN id SET DEFAULT nextval('public.lista_espera_id_seq'::regclass);

--
-- Tabla: lista_espera_premium
--
CREATE TABLE public.lista_espera_premium (
    id integer NOT NULL,
    email text NOT NULL,
    user_id integer,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.lista_espera_premium_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.lista_espera_premium_id_seq OWNED BY public.lista_espera_premium.id;
ALTER TABLE ONLY public.lista_espera_premium ALTER COLUMN id SET DEFAULT nextval('public.lista_espera_premium_id_seq'::regclass);

--
-- Tabla: push_subscriptions
--
CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    user_id integer,
    subscription jsonb NOT NULL,
    platform character varying(10) DEFAULT 'web'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;
ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);

--
-- Tabla: solicitudes_eliminacion
--
CREATE TABLE public.solicitudes_eliminacion (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    procesada boolean DEFAULT false
);

CREATE SEQUENCE public.solicitudes_eliminacion_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.solicitudes_eliminacion_id_seq OWNED BY public.solicitudes_eliminacion.id;
ALTER TABLE ONLY public.solicitudes_eliminacion ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_eliminacion_id_seq'::regclass);

--
-- Tabla: visitas
--
CREATE TABLE public.visitas (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    fecha date DEFAULT CURRENT_DATE
);

CREATE SEQUENCE public.visitas_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.visitas_id_seq OWNED BY public.visitas.id;
ALTER TABLE ONLY public.visitas ALTER COLUMN id SET DEFAULT nextval('public.visitas_id_seq'::regclass);

--
-- Primary Keys / Unique Constraints
--
ALTER TABLE ONLY public.preguntas ADD CONSTRAINT preguntas_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);
ALTER TABLE ONLY public.sesiones ADD CONSTRAINT sesiones_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.respuestas_sesion ADD CONSTRAINT respuestas_sesion_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_posts ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_posts ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.contacto ADD CONSTRAINT contacto_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lista_espera ADD CONSTRAINT lista_espera_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lista_espera ADD CONSTRAINT lista_espera_email_key UNIQUE (email);
ALTER TABLE ONLY public.lista_espera_premium ADD CONSTRAINT lista_espera_premium_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lista_espera_premium ADD CONSTRAINT lista_espera_premium_email_key UNIQUE (email);
ALTER TABLE ONLY public.push_subscriptions ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.solicitudes_eliminacion ADD CONSTRAINT solicitudes_eliminacion_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.visitas ADD CONSTRAINT visitas_pkey PRIMARY KEY (id);

--
-- Foreign Keys
--
ALTER TABLE ONLY public.lista_espera_premium ADD CONSTRAINT lista_espera_premium_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id);
ALTER TABLE ONLY public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.respuestas_sesion ADD CONSTRAINT respuestas_sesion_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.preguntas(id);
ALTER TABLE ONLY public.respuestas_sesion ADD CONSTRAINT respuestas_sesion_sesion_id_fkey FOREIGN KEY (sesion_id) REFERENCES public.sesiones(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.respuestas_sesion ADD CONSTRAINT respuestas_sesion_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id);
ALTER TABLE ONLY public.sesiones ADD CONSTRAINT sesiones_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id);

--
-- Indexes
--
CREATE INDEX idx_preguntas_anio ON public.preguntas USING btree ("año");
CREATE INDEX idx_respuestas_sesion ON public.respuestas_sesion USING btree (sesion_id);
CREATE INDEX idx_visitas_created_at ON public.visitas USING btree (created_at);
CREATE INDEX idx_visitas_fecha ON public.visitas USING btree (fecha);

-- Fin del schema
