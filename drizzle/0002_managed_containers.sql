CREATE TABLE "managed_containers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"docker_name" text NOT NULL,
	"image" text NOT NULL,
	"client_id" uuid,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "managed_containers_docker_name_unique" UNIQUE("docker_name")
);
--> statement-breakpoint
ALTER TABLE "managed_containers" ADD CONSTRAINT "managed_containers_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "managed_containers" ADD CONSTRAINT "managed_containers_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;