CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'team', 'enterprise');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan" SET DATA TYPE plan USING "plan"::"public"."plan";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allowed_repos" integer DEFAULT 1;