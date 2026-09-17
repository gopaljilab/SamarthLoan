CREATE TYPE "public"."application_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('POTENTIALLY_SUITABLE', 'NOT_MATCHED');--> statement-breakpoint
CREATE TYPE "public"."record_status" AS ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(120) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(250) NOT NULL,
	"partner_type" varchar(40) NOT NULL,
	"organization_code" varchar(100),
	"address" text NOT NULL,
	"city" varchar(100),
	"district" varchar(100),
	"state" varchar(100),
	"pincode" varchar(6),
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"phone" varchar(20),
	"email" varchar(254),
	"website" text,
	"authorized_status" boolean DEFAULT false NOT NULL,
	"accepting_applications" boolean DEFAULT false NOT NULL,
	"status" "record_status" DEFAULT 'DRAFT' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "channel_partners_coordinates" CHECK (("channel_partners"."latitude" IS NULL AND "channel_partners"."longitude" IS NULL) OR ("channel_partners"."latitude" BETWEEN -90 AND 90 AND "channel_partners"."longitude" BETWEEN -180 AND 180))
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"rating" integer,
	"category" varchar(80),
	"message" text,
	"page" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_rating_range" CHECK ("feedback"."rating" IS NULL OR "feedback"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "financial_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scheme_id" uuid,
	"principal_amount" numeric(14, 2) NOT NULL,
	"interest_rate" numeric(6, 3) NOT NULL,
	"tenure_months" integer NOT NULL,
	"moratorium_months" integer DEFAULT 0 NOT NULL,
	"monthly_emi" numeric(14, 2) NOT NULL,
	"total_interest" numeric(14, 2) NOT NULL,
	"total_repayment" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legacy_scheme_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_id" varchar(100) NOT NULL,
	"scheme_id" varchar(100) NOT NULL,
	"match_score" numeric(6, 2) NOT NULL,
	"reasons" jsonb NOT NULL,
	"breakdown" jsonb NOT NULL,
	"legacy_created_at" timestamp with time zone,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(80) NOT NULL,
	"title" varchar(250) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_operational_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"fund_utilization_percent" numeric(5, 2),
	"npa_percent" numeric(5, 2),
	"overdue_percent" numeric(5, 2),
	"processing_capacity" integer,
	"accepting_applications" boolean,
	"source" text NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"last_verified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_scheme_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"scheme_id" uuid NOT NULL,
	"is_authorized" boolean DEFAULT false NOT NULL,
	"status" "record_status" DEFAULT 'DRAFT' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheme_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scheme_id" uuid NOT NULL,
	"partner_id" uuid,
	"application_reference" varchar(40) NOT NULL,
	"requested_amount" numeric(14, 2) NOT NULL,
	"purpose" text NOT NULL,
	"status" "application_status" DEFAULT 'DRAFT' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheme_eligibility_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"rule_version" integer DEFAULT 1 NOT NULL,
	"rules" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheme_match_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"user_type" varchar(40) NOT NULL,
	"education_status" varchar(160),
	"employment_status" varchar(160),
	"annual_income" numeric(14, 2),
	"requested_amount" numeric(14, 2) NOT NULL,
	"state" varchar(100),
	"district" varchar(100),
	"pincode" varchar(6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheme_match_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"scheme_id" uuid NOT NULL,
	"match_status" "match_status" NOT NULL,
	"match_reason" jsonb NOT NULL,
	"rule_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheme_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"language_code" varchar(2) NOT NULL,
	"name" varchar(250) NOT NULL,
	"short_description" text NOT NULL,
	"description" text,
	"eligibility_text" text,
	"application_process" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scheme_translations_language" CHECK ("scheme_translations"."language_code" IN ('en', 'hi', 'kn'))
);
--> statement-breakpoint
CREATE TABLE "schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_code" varchar(80) NOT NULL,
	"name" varchar(250) NOT NULL,
	"short_description" text NOT NULL,
	"description" text,
	"category" varchar(100),
	"target_beneficiary" text,
	"min_income" numeric(14, 2),
	"max_income" numeric(14, 2),
	"min_loan_amount" numeric(14, 2),
	"max_loan_amount" numeric(14, 2),
	"interest_rate_min" numeric(6, 3),
	"interest_rate_max" numeric(6, 3),
	"tenure_min_months" integer,
	"tenure_max_months" integer,
	"moratorium_min_months" integer,
	"moratorium_max_months" integer,
	"maximum_financing_percentage" numeric(5, 2),
	"application_process" text,
	"official_source_url" text NOT NULL,
	"official_source_name" varchar(250) NOT NULL,
	"official_department" varchar(250),
	"status" "record_status" DEFAULT 'DRAFT' NOT NULL,
	"effective_from" timestamp with time zone,
	"effective_until" timestamp with time zone,
	"last_verified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schemes_income_range" CHECK ("schemes"."min_income" IS NULL OR "schemes"."max_income" IS NULL OR "schemes"."min_income" <= "schemes"."max_income"),
	CONSTRAINT "schemes_loan_range" CHECK ("schemes"."min_loan_amount" IS NULL OR "schemes"."max_loan_amount" IS NULL OR "schemes"."min_loan_amount" <= "schemes"."max_loan_amount")
);
--> statement-breakpoint
CREATE TABLE "support_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(160) NOT NULL,
	"email" varchar(254),
	"phone" varchar(20),
	"category" varchar(80) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(40) DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"state" varchar(100),
	"district" varchar(100),
	"city" varchar(100),
	"pincode" varchar(6),
	"occupation" varchar(160),
	"education_status" varchar(160),
	"annual_family_income" numeric(14, 2),
	"user_type" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profiles_pincode_format" CHECK ("user_profiles"."pincode" IS NULL OR "user_profiles"."pincode" ~ '^[0-9]{6}$')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"phone" varchar(20),
	"name" varchar(160) NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_calculations" ADD CONSTRAINT "financial_calculations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_calculations" ADD CONSTRAINT "financial_calculations_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_operational_metrics" ADD CONSTRAINT "partner_operational_metrics_partner_id_channel_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."channel_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_scheme_mappings" ADD CONSTRAINT "partner_scheme_mappings_partner_id_channel_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."channel_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_scheme_mappings" ADD CONSTRAINT "partner_scheme_mappings_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_applications" ADD CONSTRAINT "scheme_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_applications" ADD CONSTRAINT "scheme_applications_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_applications" ADD CONSTRAINT "scheme_applications_partner_id_channel_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."channel_partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_eligibility_rules" ADD CONSTRAINT "scheme_eligibility_rules_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_match_requests" ADD CONSTRAINT "scheme_match_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_match_results" ADD CONSTRAINT "scheme_match_results_request_id_scheme_match_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."scheme_match_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_match_results" ADD CONSTRAINT "scheme_match_results_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheme_translations" ADD CONSTRAINT "scheme_translations_scheme_id_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_lookup" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "channel_partners_organization_code_unique" ON "channel_partners" USING btree ("organization_code");--> statement-breakpoint
CREATE INDEX "channel_partners_discovery_lookup" ON "channel_partners" USING btree ("status","authorized_status","pincode");--> statement-breakpoint
CREATE INDEX "financial_calculations_user_created_lookup" ON "financial_calculations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_scheme_recommendations_legacy_id_unique" ON "legacy_scheme_recommendations" USING btree ("legacy_id");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_lookup" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "partner_operational_metrics_current_lookup" ON "partner_operational_metrics" USING btree ("partner_id","effective_at");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_scheme_mappings_partner_scheme_unique" ON "partner_scheme_mappings" USING btree ("partner_id","scheme_id");--> statement-breakpoint
CREATE INDEX "partner_scheme_mappings_scheme_lookup" ON "partner_scheme_mappings" USING btree ("scheme_id","is_authorized","status");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_applications_reference_unique" ON "scheme_applications" USING btree ("application_reference");--> statement-breakpoint
CREATE INDEX "scheme_applications_user_updated_lookup" ON "scheme_applications" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_eligibility_rules_version_unique" ON "scheme_eligibility_rules" USING btree ("scheme_id","rule_version");--> statement-breakpoint
CREATE INDEX "scheme_eligibility_rules_active_lookup" ON "scheme_eligibility_rules" USING btree ("scheme_id","is_active");--> statement-breakpoint
CREATE INDEX "scheme_match_requests_user_created_lookup" ON "scheme_match_requests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_match_results_request_scheme_unique" ON "scheme_match_results" USING btree ("request_id","scheme_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scheme_translations_scheme_language_unique" ON "scheme_translations" USING btree ("scheme_id","language_code");--> statement-breakpoint
CREATE UNIQUE INDEX "schemes_code_unique" ON "schemes" USING btree ("scheme_code");--> statement-breakpoint
CREATE INDEX "schemes_public_lookup" ON "schemes" USING btree ("status","last_verified_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");