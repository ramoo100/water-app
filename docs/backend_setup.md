# Backend Setup Guide: Supabase

This guide will walk you through setting up the backend for the Syrian Cigarette Distribution System using Supabase.

## Prerequisites

- A modern web browser (Chrome, Firefox, etc.).
- The `database_schema.sql` file, which has been provided in the root of this project.

## Step 1: Create a Supabase Account

1.  Navigate to [supabase.com](https://supabase.com).
2.  Click on "**Start your project**".
3.  Sign up using your preferred method (e.g., GitHub, Google, or email). The free plan is sufficient for this project.

## Step 2: Create a New Supabase Project

1.  After signing in, you will be directed to your dashboard. Click the "**New project**" button.
2.  You may be asked to choose or create an **Organization**. You can use your default personal organization.
3.  Fill in the project details:
    *   **Name**: Choose a name for your project, for example, `syria-cigarette-distro`.
    *   **Database Password**: Create a strong password and **save it immediately** in a secure password manager. You will need this for direct database access later.
    *   **Region**: Choose the region closest to your user base.
    *   **Pricing Plan**: The **Free** plan is selected by default and is all you need.
4.  Click "**Create new project**".

Supabase will now provision your backend resources. This may take a couple of minutes.

## Step 3: Run the Database Schema SQL

Once your project is ready, you need to create the database structure using the provided SQL script.

1.  From the left sidebar of your project dashboard, find and click on the **SQL Editor** icon (it looks like `<>`).
2.  On the SQL Editor page, click "**+ New query**". You can name it `Initial Schema Setup` or something similar.
3.  Open the `database_schema.sql` file on your local machine, select all the text, and copy it.
4.  Paste the entire content of the script into the text area of the SQL Editor in Supabase.
5.  Click the "**RUN**" button (or use the shortcut `Ctrl+Enter` / `Cmd+Enter`).

The script will execute. You should see a "**Success. No rows returned**" message, indicating that all tables, functions, and policies were created successfully.

## Step 4: Verify the Setup

1.  From the left sidebar, click the **Table Editor** icon (it looks like a spreadsheet).
2.  You should now see all the tables defined in the schema (`users`, `products`, `orders`, `chat`, etc.) listed on the left.
3.  Click on a few tables like `products` and `orders` to confirm they have the correct columns.
4.  **Important Security Check**: Let's verify that Row Level Security (RLS) is enabled.
    *   In the sidebar, go to **Authentication** -> **Policies**.
    *   You should see a list of tables. Find the `products` table in the list. It should have a green "RLS Enabled" badge next to it. Our script handled this automatically for all relevant tables.

## Step 5: Get Your API Keys

You will need the project's API keys to connect the frontend applications to this backend.

1.  In the left sidebar, go to **Project Settings** (the gear icon at the bottom).
2.  In the Project Settings menu, click on **API**.
3.  You will find your **Project URL** and your `anon` **public** key.
    *   **URL**: This is your unique API endpoint.
    *   **anon (public)**: This is the key used for safe, public-facing operations in the client apps. It will respect the Row Level Security policies we defined.
4.  Copy both of these values and save them somewhere safe. You will need them for app configuration in the next steps. **Do not share the `service_role` secret key publicly.**

Your backend is now fully configured and ready to be connected to the frontend applications.
