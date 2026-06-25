# Quotation PDF Generator — User Manual

> **Version:** 1.0
> **Last Updated:** June 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Navigation](#3-navigation)
4. [Managing Quotations](#4-managing-quotations)
   - 4.1 [View All Quotations](#41-view-all-quotations)
   - 4.2 [Create a New Quotation](#42-create-a-new-quotation)
   - 4.3 [Preview a Quotation](#43-preview-a-quotation)
   - 4.4 [Edit a Quotation](#44-edit-a-quotation)
   - 4.5 [Download PDF](#45-download-pdf)
   - 4.6 [Delete a Quotation](#46-delete-a-quotation)
5. [Managing Packages](#5-managing-packages)
6. [Managing Special Offers](#6-managing-special-offers)
7. [Supplier Information](#7-supplier-information)
8. [Profile & Account Settings](#8-profile--account-settings)
9. [Notifications](#9-notifications)
10. [Frequently Asked Questions](#10-frequently-asked-questions)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Introduction

**Quotation PDF Generator** is a web-based application designed for internal staff to create, manage, and export professional quotation documents as PDF files.

### What you can do with this system

- Create bilingual quotation documents (English and Thai)
- Select pricing packages with monthly or yearly billing
- Add custom line items and special offers to quotations
- Automatically generate and download PDF documents
- Search, filter, and manage all quotations in one place

### Who is this for

This system is intended for staff members who prepare quotations for customers. No technical knowledge is required to use it.

---

## 2. Getting Started

### Logging In

1. Open the application URL in your web browser (Chrome, Edge, or Safari recommended).
2. You will see the **Login** page.
3. Enter your **Email** and **Password**.
4. Click **Sign In**.

> **Note:** If you do not have an account, click the **Register** link on the login page to create one. You will need to provide your name, email, and a password (minimum 6 characters).

### Logging Out

- Click your **name** in the top-right corner of the screen.
- Click **Logout**.

---

## 3. Navigation

The application has a sidebar on the left side (or a menu button on mobile) with these sections:

| Menu Item | Purpose |
|-----------|---------|
| **Quotations** | View, create, edit, and delete all quotations |
| **Supplier Info** | Manage your company details shown on PDFs |
| **Packages** | Manage pricing packages available for quotations |
| **Special Offers** | Manage promotional offers included in quotations |

- On **mobile devices**, tap the menu icon (three horizontal lines) in the top-left corner to open the navigation menu.
- Your **profile and account settings** can be accessed by clicking your name in the top-right corner.

---

## 4. Managing Quotations

### 4.1 View All Quotations

When you log in, you land on the **Quotations** page. This is your main dashboard.

**What you see:**

| Column | Description |
|--------|-------------|
| Quo. No. | The unique quotation number (click to preview) |
| Customer | The customer company name |
| Issued Date | When the quotation was created |
| Valid Until | Expiration date of the quotation |
| Total | The total amount in Thai Baht |
| Actions | View, Edit, and Delete buttons |

**Searching and Filtering:**

- **Search**: Type a quotation number or customer name in the search box to find specific quotations.
- **Date Filter**: Use the **From** and **To** date pickers to filter by date range. Click **Clear dates** to remove the filter.
- **Pagination**: If there are many quotations, use the **Previous** and **Next** buttons at the bottom to navigate pages.

---

### 4.2 Create a New Quotation

1. From the **Quotations** page, click the **New Quotation** button in the top-right corner.
2. You will be taken to the **Create Quotation** form.

#### Step-by-step form sections:

#### Section A: Customer Information

Fill in the customer details:

| Field | Required | Description |
|-------|----------|-------------|
| Company Name (EN) | **Yes** | Customer company name in English |
| Company Name (TH) | **Yes** | Customer company name in Thai |
| Tax ID | **Yes** | Must be exactly 13 digits (numbers only) |
| Address | **Yes** | Customer address |

> **Note on Tax ID:** The system automatically removes non-numeric characters. You must enter exactly 13 digits. If the Tax ID is too short or contains letters, you will see an error message.

#### Section B: Document Information

| Field | Description |
|-------|-------------|
| Quotation Number | Auto-generated (e.g., QUO202606001). You can edit it, but the system will warn you if the format is incorrect or the number is already used. |
| Issued Date | Today's date by default. You can change it. |
| Valid Until | Default is 2 months from today. |
| Due Date | Default is 3 months from today. This appears on the PDF. |

> **Warning:** If you change the quotation number to one that already exists, a red error message will appear and you will not be able to submit.

#### Section C: Package Selection

1. Choose a **billing period**: **Monthly** or **Yearly** (toggle at the top).
2. Click on a **package card** to select it. The selected package will have a highlighted border and a "Selected" badge.
3. Once selected, the package price and description are automatically added to the itemization table.

> **Note:** You must select a package to create a quotation. If you try to submit without one, you will see an error message.

#### Section D: Itemization

This table shows all line items in the quotation:

- **PACKAGE row**: Automatically created from your package selection. You cannot edit it directly — change the package or billing type above to update it.
- **ADDON rows**: You can add additional items by clicking **Add Item**.

For each addon item, fill in:

| Field | Description |
|-------|-------------|
| Description (English) | Name of the add-on item |
| Description (Thai) | Thai translation (optional) |
| Qty | Quantity (minimum 1) |
| Unit Price | Price per unit in Thai Baht |

- Click the **trash icon** on the right to remove an addon item.
- The **Amount** column is calculated automatically (Qty x Unit Price).

#### Section E: Special Offers

1. You will see a list of all active special offers with checkboxes.
2. **Check** the offers you want to include in the quotation.
3. You can also manage offers directly from this section:
   - **Edit**: Hover over an offer and click the pencil icon to edit it.
   - **Delete**: Hover over an offer and click the trash icon to delete it.
   - **Add Offer**: Click the **Add Offer** button to create a new special offer.

> **Note:** Default offers are automatically checked when you first open the form.

#### Section F: Financial Summary

Review the calculated totals:

| Line | Description |
|------|-------------|
| Package Amount | Total from the selected package |
| Add-ons Amount | Total from all addon items |
| Discount | Enter a discount amount if needed |
| Subtotal | Package + Add-ons - Discount |
| VAT 7% | Toggle the VAT switch ON to add 7% tax |
| Total Amount | Final amount including VAT |

> **Note:** You can enter a discount amount by typing in the Discount field. Set it to 0 for no discount.

#### Section G: Authorized Signature

- If you have a signature on file, it will appear automatically.
- To upload a new signature:
  1. Click the **upload area** or drag and drop an image.
  2. Accepted formats: **PNG, JPG, JPEG** (maximum 2MB).
- To remove the signature, click the **X** button on the preview image.

#### Submitting the Quotation

1. Review all the information you have entered.
2. Click **Create Quotation** at the bottom of the page.
3. A **loading screen** will appear while the system generates the PDF.
4. Once complete, you will see a **success notification** and be redirected to the Quotations list.

> **Important:** Do not close the browser or navigate away while the loading screen is displayed. The system is generating your PDF.

> **Tip:** If there are validation errors (missing required fields), the form will scroll to the first error. Fix the highlighted fields and try again.

---

### 4.3 Preview a Quotation

1. From the **Quotations** list, click the **quotation number** (blue link) or the **eye icon**.
2. The **Preview** page opens, showing:
   - **PDF Preview**: A rendered PDF document embedded in the page.
   - **Customer Details**: Company name, Tax ID, and address.
   - **Document Info**: Dates, package, billing type, and file size.
   - **Items Table**: All line items with descriptions and amounts.
   - **Financial Summary**: Complete breakdown of costs.

**Actions available on the Preview page:**

| Button | Function |
|--------|----------|
| Download | Save the PDF to your computer |
| Edit | Open the quotation in edit mode |
| Delete | Delete the quotation (with confirmation) |

> **Note:** If the PDF fails to load, a **Retry** button will appear. Click it to reload the preview.

---

### 4.4 Edit a Quotation

1. From the **Quotations** list, click the **pencil icon** on the quotation you want to edit.
2. Or from the **Preview** page, click the **Edit** button.
3. The **Edit Quotation** form opens, pre-filled with the existing quotation data.

**What you can edit:**

- Customer information (company name, Tax ID, address)
- Issued date, Valid until, and Due date
- Package selection and billing type
- Addon items (add, remove, or modify)
- Special offers (add or remove)
- Discount and VAT settings
- Signature

**What you cannot edit:**

- **Quotation Number** — this is locked after creation

4. Make your changes and click **Update Quotation** at the bottom.
5. A loading screen will appear while the system regenerates the PDF.
6. Once complete, a **success notification** appears and you are redirected to the Quotations list.

> **Note:** Editing a quotation regenerates the PDF automatically. The previous version is replaced.

---

### 4.5 Download PDF

There are two ways to download a quotation PDF:

**From the Preview page:**
1. Open the quotation preview.
2. Click the **Download** button in the header.
3. The PDF file will be saved to your computer with the quotation number as the filename (e.g., `QUO202606001.pdf`).

**Note:** The download button shows a spinner while generating. Wait for the download to start.

---

### 4.6 Delete a Quotation

1. From the **Quotations** list, click the **trash icon** on the quotation you want to delete.
2. Or from the **Preview** page, click the **Delete** button.
3. A **confirmation dialog** will appear asking: "Are you sure?"
4. Click **Delete** to confirm, or **Cancel** to go back.

> **Warning:** Deleting a quotation is permanent. The quotation and its PDF will be permanently removed and cannot be recovered.

---

## 5. Managing Packages

Packages define the pricing tiers that appear on quotations. Navigate to **Packages** in the sidebar.

### Viewing Packages

All packages are displayed as cards showing:

- Package name (English and Thai)
- User count description
- Monthly and yearly prices
- Active/Inactive status

### Adding a New Package

1. Click **Add Package** in the top-right corner.
2. Fill in the form:

| Field | Required | Description |
|-------|----------|-------------|
| Name (EN) | **Yes** | Package name in English |
| Name (TH) | No | Package name in Thai |
| User Count (EN) | No | e.g., "3 Organization Users" |
| User Count (TH) | No | Thai translation |
| Monthly Price (THB) | No | Price per month in Baht |
| Yearly Price (THB) | No | Price per year in Baht |
| Sort Order | No | Lower numbers appear first |
| Active | No | Toggle to make the package available |

3. Click **Save**.

### Editing a Package

1. Click the **pencil icon** on the package card.
2. Modify the fields as needed.
3. Click **Save**.

### Deleting a Package

1. Click the **trash icon** on the package card.
2. Confirm the deletion in the dialog.

> **Warning:** Deleting a package does not affect existing quotations that already use it, but the package will no longer be available for new quotations.

> **Tip:** If you want to temporarily hide a package without deleting it, toggle the **Active** switch off. Inactive packages appear dimmed and are not shown on the quotation creation form.

---

## 6. Managing Special Offers

Special offers are promotional items that can be included in quotations. Navigate to **Special Offers** in the sidebar.

### Viewing Offers

All offers are displayed as cards showing:

- Offer name (English and Thai)
- Description
- **Default** badge (automatically selected on new quotations)
- **Inactive** badge (if the offer is disabled)

### Adding a New Offer

1. Click **Add Offer** in the top-right corner.
2. Fill in the form:

| Field | Required | Description |
|-------|----------|-------------|
| Name (EN) | **Yes** | Offer name in English |
| Name (TH) | **Yes** | Offer name in Thai |
| Description (EN) | No | Brief description |
| Description (TH) | No | Thai translation |
| Active | No | Toggle to enable the offer |
| Default | No | Toggle to auto-select on new quotations |
| Order | No | Sort order (lower numbers appear first) |

3. Click **Save**.

### Editing an Offer

1. Click the **pencil icon** on the offer card.
2. The form opens with all current values pre-filled.
3. Modify the fields as needed.
4. Click **Save**.

### Deleting an Offer

1. Click the **trash icon** on the offer card.
2. Confirm the deletion in the dialog.

> **Note:** You can also add, edit, and delete offers directly from the quotation creation and edit pages, without navigating to the Special Offers page.

### About Default Offers

- Offers marked as **Default** are automatically checked when creating a new quotation.
- You can still uncheck them if they are not needed for a specific quotation.

---

## 7. Supplier Information

The Supplier Information page contains your company details that appear on every quotation PDF. Navigate to **Supplier Info** in the sidebar.

### Editing Supplier Information

| Field | Required | Description |
|-------|----------|-------------|
| Company Name (EN) | **Yes** | Your company name in English |
| Company Name (TH) | No | Your company name in Thai |
| Tax ID | **Yes** | Your company tax ID |
| Address | **Yes** | Your company address |
| Contact Info (PDF Footer) | No | Contact details shown at the bottom of every PDF |

1. Edit any field as needed.
2. Click **Save Changes** at the bottom.

> **Important:** Changes to supplier information affect all **future** PDFs. Previously generated PDFs are not updated retroactively.

---

## 8. Profile & Account Settings

Access your profile by clicking your **name** in the top-right corner.

### Updating Your Profile

1. Edit your **Name** or **Email**.
2. Click **Save Changes**.

### Changing Your Password

1. In the **Password** section, click **Change Password**.
2. Enter your **Current Password**.
3. Enter your **New Password** (minimum 6 characters).
4. Confirm the new password in **Confirm New Password**.
5. Click **Update Password**.

> **Note:** If the new password and confirmation do not match, the field will be highlighted in red and the button will be disabled. Make sure both fields match.

---

## 9. Notifications

The system displays notifications to confirm your actions:

| Action | Notification Message |
|--------|---------------------|
| Quotation created | "Quotation created successfully." |
| Quotation updated | "Quotation updated successfully." |
| Quotation deleted | "Quotation deleted successfully." |
| Offer created | "Offer created successfully." |
| Offer updated | "Offer updated successfully." |
| Offer deleted | "Offer deleted successfully." |
| Profile updated | "Profile updated" |
| Password changed | "Password changed" |

- **Green notifications** indicate success.
- **Red notifications** indicate an error. If you see an error, try the action again or contact your system administrator.

Notifications appear at the top-center of the screen and disappear automatically after a few seconds.

---

## 10. Frequently Asked Questions

### Q: Can I change the quotation number after creating a quotation?
**A:** No. The quotation number is locked once the quotation is created. If you need a different number, delete the quotation and create a new one.

### Q: Can I include both monthly and yearly pricing in one quotation?
**A:** No. Each quotation uses one billing period (monthly or yearly). You would need to create separate quotations for different billing periods.

### Q: What happens when I edit a quotation?
**A:** The PDF is regenerated with the updated information. The previous PDF is replaced.

### Q: Can I recover a deleted quotation?
**A:** No. Deletion is permanent. Please double-check before confirming deletion.

### Q: Why is the Tax ID field showing an error?
**A:** The Tax ID must be exactly 13 digits. The system only accepts numbers. Make sure you have entered all 13 digits without spaces or dashes.

### Q: Why are some special offers not showing on the Create Quotation page?
**A:** Only **active** offers are displayed. If an offer is inactive, it will not appear in the offer selection. Go to **Special Offers** to check its status.

### Q: Can I use the application on my phone?
**A:** Yes. The application is responsive and works on mobile devices. Use the menu button in the top-left corner to navigate.

### Q: How do I add my signature to quotations?
**A:** Upload a signature image (PNG, JPG, or JPEG) in the **Authorized Signature** section when creating or editing a quotation. If you have already uploaded a signature to your profile, it will be used automatically.

---

## 11. Troubleshooting

### The page is loading slowly or not responding

- Check your internet connection.
- Refresh the page (press F5 or Ctrl+R).
- Try a different browser (Chrome or Edge recommended).

### PDF preview shows "Unable to load PDF preview"

- Click the **Retry** button that appears on the page.
- If the problem persists, refresh the entire page.
- If the issue continues, contact your system administrator.

### I was logged out unexpectedly

- Your session may have expired. Log in again.
- If the problem repeats, check that your browser accepts cookies.

### The "Create Quotation" button does not work

- Make sure all **required fields** are filled in. Required fields are marked with an asterisk (*).
- Check for red error messages below any fields.
- The quotation number must not have errors (check for red messages below it).

### I cannot upload a signature image

- Make sure the file is in **PNG, JPG, or JPEG** format.
- The file size must be under **2MB**.
- If the upload fails, try a smaller image or a different file.

### I see a "Failed to create quotation" error

- This may be a temporary server issue. Try again after a few seconds.
- If the problem persists, contact your system administrator.

---

## Quick Reference Card

| Task | How to do it |
|------|-------------|
| Log in | Enter email and password on the login page |
| Create a quotation | Quotations → New Quotation → Fill form → Create Quotation |
| View a quotation | Quotations → Click quotation number or eye icon |
| Edit a quotation | Quotations → Click pencil icon → Edit → Update Quotation |
| Download PDF | Open quotation preview → Click Download |
| Delete a quotation | Quotations → Click trash icon → Confirm Delete |
| Manage packages | Sidebar → Packages → Add/Edit/Delete |
| Manage offers | Sidebar → Special Offers → Add/Edit/Delete |
| Update company info | Sidebar → Supplier Info → Edit → Save Changes |
| Change password | Click name (top-right) → Change Password |

---

*End of User Manual*
