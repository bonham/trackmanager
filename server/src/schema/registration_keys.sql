-- Table: public.registration_keys

-- DROP TABLE IF EXISTS public.registration_keys;

CREATE TABLE IF NOT EXISTS public.registration_keys
(
    regkey character varying COLLATE pg_catalog."default" NOT NULL DEFAULT gen_random_uuid(),
    username character varying COLLATE pg_catalog."default" NOT NULL,
    created timestamp with time zone NOT NULL DEFAULT now(),
    used boolean NOT NULL DEFAULT false,
    CONSTRAINT registration_keys_pkey PRIMARY KEY (regkey)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.registration_keys
    OWNER to passkeyadmin;