# Nia - Platform 

[![GitHub Release](https://img.shields.io/github/v/release/nkepe/Nia-Platform?color=0f172a&label=version)](https://github.com/nkepe/Nia-Platform/releases/tag/v1.0.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

**Nia** is a web-based recruitment and attachment matching platform engineered to bridge the gap between tertiary institution students, graduates, and prospective employers across Kenya. The application streamlines student discovery of industrial attachments, internships, and entry-level positions, providing direct application workflows, CV attachment capabilities, and a dedicated administrative console for moderation.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [System Architecture & Stack](#system-architecture--stack)
- [Database Schema & Security (RLS)](#database-schema--security-rls)
- [File & Storage Specifications](#file-storage-specifications)
- [Getting Started & Local Setup](#getting-started--local-setup)
- [Administrative Controls](#administrative-controls)
- [Author & Academic Credits](#author--academic-credits)

---

## Project Overview

Tertiary students in emerging regions face significant friction in discovering verified industrial attachments and internship openings. **Nia** addresses this challenge through:
1. **Centralized Discovery:** Consolidated listings of verified opportunities filtered by industry, location, and contract type.
2. **Simplified Application Pipelines:** One-click application tracking linked directly to the student's profile and curriculum vitae (CV).
3. **Institutional Governance:** Granular administrator controls to audit listings, manage student submissions, and enforce account suspensions or data pruning.

---

## Key Features

### Student Portal
- **Session Authentication:** Secure authentication handling sign-up, sign-in, and persistent session state.
- **Dynamic Search & Filtering:** Real-time search across job titles, organization names, and geographic locations (e.g., Voi, Mombasa, Nairobi, Remote), accompanied by contract-type sorting.
- **Application Tracking:** History view of all submitted opportunities with direct visual indicators (`Submitted` / `Applied`).
- **Profile & Resume Management:** Central profile editor enabling students to maintain contact information, institutional affiliation, academic courses, and upload documents up to 30MB.
- **Application Advisory Flow:** Responsive prompt encouraging applicants to upload a resume prior to submission to optimize applicant review.

### Administrator Control Center
- **Publishing Console:** Dedicated portal for composing and launching opportunities with custom categorization.
- **Listing Governance:** Real-time editing and cascading deletion of stale or fulfilled opportunity postings.
- **Application Auditing:** Review of incoming applicants, submission timestamps, and instant preview of uploaded resumes.
- **User Moderation (Ban/Delete):** Platform-level account suspension via status flags, and hard user purges using PostgreSQL `SECURITY DEFINER` Remote Procedure Calls (RPC).

---

## System Architecture & Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend UI** | HTML5, CSS3 (Custom Responsive Layouts), JavaScript (ES6 Modules) |
| **Icons & Assets** | Font Awesome 6.5, SVG Vector Icons |
| **Authentication** | Supabase Auth (JWT-based session management) |
| **Database** | PostgreSQL hosted on Supabase |
| **Cloud Storage** | Supabase S3-Compatible Object Storage |
| **Authorization** | Row Level Security (RLS) Policies & Postgres Functions |

---

## Database Schema & Security (RLS)

The platform enforces Row Level Security (RLS) across all operational tables to safeguard student data privacy:

### Tables
1. **`profiles`**: Stores student biographical data, academic department, and resume pointers.
   - Columns: `id (UUID, PK)`, `email`, `full_name`, `phone`, `institution`, `course`, `bio`, `resume_url`, `status`, `role`.
2. **`opportunities`**: Stores verified internship and attachment openings.
   - Columns: `id (UUID, PK)`, `title`, `company`, `location`, `type`, `description`, `created_at`.
3. **`applications`**: Matches student accounts to opportunity records.
   - Columns: `id (UUID, PK)`, `opportunity_id (FK)`, `user_id (FK)`, `user_email`, `resume_url`, `created_at`.

### Relational Integrity & Cascades
Deletions execute via `ON DELETE CASCADE`:
- Removing an opportunity automatically purges its associated application logs.
- Admin execution of `delete_user_by_admin(uuid)` deletes the identity record from `auth.users`, cascading through both public profiles and submitted applications.

---

## File & Storage Specifications

- **Bucket Identifier:** `resumes`
- **Bucket Visibility:** `Public` (direct reading enabled for hiring administrators)
- **Upload Constraints:** File size capped at **30MB** (`31,457,280 bytes`).
- **Accepted MIME Types:** `.pdf`, `.doc`, `.docx` (`application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
- **Storage Policy:** Folder structure isolated by applicant user ID (`{user_id}/resume_{timestamp}.ext`), preventing unauthorized directory walking.

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/nkepe/Nia-Platform.git](https://github.com/nkepe/Nia-Platform.git)
   cd Nia-Platform
   
