-- Table: public.cred_authenticators

-- DROP TABLE IF EXISTS public.cred_authenticators;

CREATE TABLE IF NOT EXISTS public.cred_authenticators
(
    credentialid character varying COLLATE pg_catalog."default" NOT NULL,
    credentialpublickey bytea NOT NULL,
    counter bigint NOT NULL,
    credentialdevicetype character varying(32) COLLATE pg_catalog."default" NOT NULL,
    credentialbackedup boolean NOT NULL,
    transports character varying(255) COLLATE pg_catalog."default" NOT NULL,
    userid character varying COLLATE pg_catalog."default" NOT NULL,
    creationdate timestamp with time zone NOT NULL,
    CONSTRAINT cred_authenticators_pkey PRIMARY KEY (credentialid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.cred_authenticators
    OWNER to passkeyadmin;