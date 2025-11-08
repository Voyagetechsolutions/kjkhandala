-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "app_role" AS ENUM ('super_admin', 'admin', 'operations_manager', 'maintenance_manager', 'hr_manager', 'finance_manager', 'ticketing_officer', 'booking_officer', 'driver', 'passenger');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "route_type" AS ENUM ('local', 'cross_border');

-- CreateEnum
CREATE TYPE "seat_status" AS ENUM ('available', 'booked', 'selected');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "id_number" TEXT,
    "avatar_url" TEXT,
    "department" TEXT,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role" "app_role" NOT NULL,
    "department" TEXT,
    "permissions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role_level" INTEGER NOT NULL DEFAULT 1,
    "assigned_by" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID,
    "full_name" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "hire_date" DATE NOT NULL,
    "salary" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "date_of_birth" DATE,
    "address" TEXT,
    "emergency_contact" TEXT,
    "emergency_phone" TEXT,
    "bank_account" TEXT,
    "tax_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_attendance" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "staff_id" UUID NOT NULL,
    "attendance_date" DATE NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'present',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "staff_id" UUID NOT NULL,
    "pay_period_start" DATE NOT NULL,
    "pay_period_end" DATE NOT NULL,
    "basic_salary" DECIMAL(10,2) NOT NULL,
    "allowances" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "overtime" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bonuses" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gross_pay" DECIMAL(10,2) NOT NULL,
    "net_pay" DECIMAL(10,2) NOT NULL,
    "payment_date" DATE,
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "bus_number" TEXT,
    "number_plate" TEXT NOT NULL,
    "registration_number" TEXT,
    "seating_capacity" INTEGER NOT NULL,
    "layout_rows" INTEGER NOT NULL DEFAULT 10,
    "layout_columns" INTEGER NOT NULL DEFAULT 4,
    "model" TEXT,
    "manufacturer" TEXT,
    "year_of_manufacture" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "gps_device_id" TEXT,
    "last_service_date" DATE,
    "next_service_date" DATE,
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "fuel_type" TEXT NOT NULL DEFAULT 'diesel',
    "insurance_expiry" DATE,
    "license_expiry" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bus_id" UUID NOT NULL,
    "service_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "service_date" DATE NOT NULL,
    "cost" DECIMAL(10,2),
    "mileage_at_service" INTEGER,
    "service_provider" TEXT,
    "parts_replaced" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "technician_name" TEXT,
    "completion_date" DATE,
    "next_service_date" DATE,
    "invoice_number" TEXT,
    "warranty_expiry" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_reminders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bus_id" UUID NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "notified_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "full_name" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "license_expiry" DATE NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "date_of_birth" DATE,
    "hire_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "experience_years" INTEGER,
    "emergency_contact" TEXT,
    "emergency_phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_assignments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "schedule_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route_name" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "distance_km" DECIMAL(10,2),
    "duration_hours" DECIMAL(5,2),
    "estimated_duration_minutes" INTEGER,
    "route_type" "route_type" NOT NULL DEFAULT 'local',
    "status" TEXT NOT NULL DEFAULT 'active',
    "stops" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route_id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "departure_date" DATE NOT NULL,
    "departure_time" TIME NOT NULL,
    "arrival_time" TIME,
    "available_seats" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "actual_departure_time" TIMESTAMP(3),
    "actual_arrival_time" TIMESTAMP(3),
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_offices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "office_name" TEXT,
    "location" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "contact_number" TEXT NOT NULL,
    "manager_name" TEXT,
    "operating_hours" TEXT NOT NULL,
    "opening_hours" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_offices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "passenger_name" TEXT NOT NULL,
    "passenger_phone" TEXT NOT NULL,
    "passenger_email" TEXT,
    "passenger_id_number" TEXT,
    "seat_number" TEXT NOT NULL,
    "number_of_seats" INTEGER NOT NULL DEFAULT 1,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'pending',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "booking_reference" TEXT NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_in_at" TIMESTAMP(3),
    "special_requirements" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "expense_type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "vendor" TEXT,
    "invoice_number" TEXT,
    "payment_method" TEXT,
    "approved_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "bus_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_summary" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "date" DATE NOT NULL,
    "route_id" UUID,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cash_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "card_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "mobile_money_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refunds" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_tracking" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "bus_id" UUID,
    "schedule_id" UUID,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "speed" DECIMAL(10,2),
    "heading" DECIMAL(5,2),
    "altitude" DECIMAL(10,2),
    "accuracy" DECIMAL(10,2),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "fuel_level" DECIMAL(5,2),
    "engine_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "target_user_id" UUID,
    "target_role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "related_entity_type" TEXT,
    "related_entity_id" UUID,
    "action_url" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "table_name" TEXT NOT NULL,
    "record_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_employee_id_key" ON "staff"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "staff_user_id_idx" ON "staff"("user_id");

-- CreateIndex
CREATE INDEX "staff_employee_id_idx" ON "staff"("employee_id");

-- CreateIndex
CREATE INDEX "staff_department_idx" ON "staff"("department");

-- CreateIndex
CREATE INDEX "staff_status_idx" ON "staff"("status");

-- CreateIndex
CREATE INDEX "staff_attendance_staff_id_idx" ON "staff_attendance"("staff_id");

-- CreateIndex
CREATE INDEX "staff_attendance_attendance_date_idx" ON "staff_attendance"("attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_staff_id_attendance_date_key" ON "staff_attendance"("staff_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "buses_number_plate_key" ON "buses"("number_plate");

-- CreateIndex
CREATE INDEX "buses_bus_number_idx" ON "buses"("bus_number");

-- CreateIndex
CREATE INDEX "buses_status_idx" ON "buses"("status");

-- CreateIndex
CREATE INDEX "buses_next_service_date_idx" ON "buses"("next_service_date");

-- CreateIndex
CREATE INDEX "maintenance_records_bus_id_idx" ON "maintenance_records"("bus_id");

-- CreateIndex
CREATE INDEX "maintenance_records_service_date_idx" ON "maintenance_records"("service_date");

-- CreateIndex
CREATE INDEX "maintenance_records_status_idx" ON "maintenance_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_license_number_key" ON "drivers"("license_number");

-- CreateIndex
CREATE INDEX "driver_assignments_schedule_id_idx" ON "driver_assignments"("schedule_id");

-- CreateIndex
CREATE INDEX "driver_assignments_driver_id_idx" ON "driver_assignments"("driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_assignments_schedule_id_driver_id_key" ON "driver_assignments"("schedule_id", "driver_id");

-- CreateIndex
CREATE INDEX "routes_status_idx" ON "routes"("status");

-- CreateIndex
CREATE INDEX "routes_origin_destination_idx" ON "routes"("origin", "destination");

-- CreateIndex
CREATE INDEX "schedules_route_id_idx" ON "schedules"("route_id");

-- CreateIndex
CREATE INDEX "schedules_bus_id_idx" ON "schedules"("bus_id");

-- CreateIndex
CREATE INDEX "schedules_departure_date_idx" ON "schedules"("departure_date");

-- CreateIndex
CREATE INDEX "schedules_status_idx" ON "schedules"("status");

-- CreateIndex
CREATE INDEX "schedules_route_id_departure_date_idx" ON "schedules"("route_id", "departure_date");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_reference_key" ON "bookings"("booking_reference");

-- CreateIndex
CREATE INDEX "bookings_schedule_id_idx" ON "bookings"("schedule_id");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_booking_date_idx" ON "bookings"("booking_date");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_payment_status_idx" ON "bookings"("payment_status");

-- CreateIndex
CREATE INDEX "bookings_checked_in_at_idx" ON "bookings"("checked_in_at");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "expenses_expense_type_idx" ON "expenses"("expense_type");

-- CreateIndex
CREATE INDEX "revenue_summary_date_idx" ON "revenue_summary"("date");

-- CreateIndex
CREATE INDEX "revenue_summary_route_id_idx" ON "revenue_summary"("route_id");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_summary_date_route_id_key" ON "revenue_summary"("date", "route_id");

-- CreateIndex
CREATE INDEX "gps_tracking_bus_id_timestamp_idx" ON "gps_tracking"("bus_id", "timestamp");

-- CreateIndex
CREATE INDEX "gps_tracking_schedule_id_idx" ON "gps_tracking"("schedule_id");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_target_user_id_status_idx" ON "notifications"("target_user_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_table_name_idx" ON "audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reminders" ADD CONSTRAINT "maintenance_reminders_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_assignments" ADD CONSTRAINT "driver_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_summary" ADD CONSTRAINT "revenue_summary_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_tracking" ADD CONSTRAINT "gps_tracking_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_tracking" ADD CONSTRAINT "gps_tracking_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
