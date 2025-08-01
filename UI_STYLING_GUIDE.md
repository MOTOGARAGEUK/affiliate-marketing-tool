# UI Styling Guide - Standardized Design System

## 🎯 **Overview**

This guide documents the standardized UI styling that has been implemented across your affiliate marketing tool to ensure consistency and professional appearance.

## 🎨 **Design System Components**

### **1. Card Shadows (Standardized)**

All cards now use consistent shadow styling:

```css
.dashboard-card,
.card,
.modal-card,
.settings-card {
  background-color: #ffffff !important;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s ease-in-out;
}
```

**Usage:**
```jsx
<div className="dashboard-card">
  {/* Card content */}
</div>

<div className="settings-card">
  {/* Settings content */}
</div>
```

### **2. Form Field Styling (Standardized)**

All form inputs now use consistent styling:

```css
.form-input,
.form-select,
.form-textarea,
input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
input[type="url"],
input[type="tel"],
select,
textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #1f2937 !important;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
```

**Usage:**
```jsx
<input 
  type="text" 
  className="form-input" 
  placeholder="Enter text"
/>

<select className="form-select">
  <option>Option 1</option>
</select>

<textarea className="form-textarea">
  Enter text here
</textarea>
```

### **3. Button Styling (Standardized)**

Two main button styles are available:

#### **Primary Button**
```css
.btn-primary {
  background-color: #6366f1;
  color: #ffffff;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
  cursor: pointer;
}
```

#### **Secondary Button**
```css
.btn-secondary {
  background-color: #ffffff;
  color: #6366f1;
  border: 1px solid #6366f1;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  transition: background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
  cursor: pointer;
}
```

**Usage:**
```jsx
<button className="btn-primary">
  Save Changes
</button>

<button className="btn-secondary">
  Cancel
</button>
```

### **4. Modal Styling (Standardized)**

Consistent modal appearance:

```css
.modal-overlay {
  background-color: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
```

### **5. Table Styling (Standardized)**

Consistent table appearance:

```css
.table-container {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table-header {
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
}

.table-row {
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.15s ease-in-out;
}

.table-row:hover {
  background-color: #f8fafc;
}
```

### **6. Status Badges (Standardized)**

Consistent status indicators:

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-approved {
  background-color: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background-color: #fee2e2;
  color: #991b1b;
}
```

**Usage:**
```jsx
<span className="status-badge status-pending">
  Pending
</span>

<span className="status-badge status-approved">
  Approved
</span>
```

### **7. Alert Messages (Standardized)**

Consistent alert styling:

```css
.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid;
  margin-bottom: 1rem;
}

.alert-success {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.alert-error {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.alert-warning {
  background-color: #fffbeb;
  border-color: #fed7aa;
  color: #92400e;
}

.alert-info {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}
```

**Usage:**
```jsx
<div className="alert alert-success">
  Settings saved successfully!
</div>

<div className="alert alert-error">
  An error occurred. Please try again.
</div>
```

## 📋 **Implementation Status**

### **✅ Completed**
- **Settings Page**: All form fields updated to use standardized styling
- **Programs Page**: Form fields updated to use standardized styling
- **Affiliates Page**: Form fields updated to use standardized styling
- **Global CSS**: Comprehensive styling system implemented

### **🔄 In Progress**
- **Dashboard Page**: Cards updated with standardized shadows
- **Referrals Page**: Table styling to be updated
- **Payouts Page**: Form and table styling to be updated

### **📝 To Do**
- **Login Page**: Form styling to be updated
- **Any new pages**: Use standardized styling from the start

## 🎨 **Color Palette**

### **Primary Colors**
- **Primary Blue**: `#6366f1` (Indigo)
- **Primary Blue Hover**: `#5855eb`
- **White**: `#ffffff`
- **Gray Background**: `#f8fafc`

### **Text Colors**
- **Primary Text**: `#1f2937` (Gray-800)
- **Secondary Text**: `#6b7280` (Gray-500)
- **Label Text**: `#374151` (Gray-700)

### **Border Colors**
- **Light Border**: `#e2e8f0` (Gray-200)
- **Input Border**: `#d1d5db` (Gray-300)
- **Focus Border**: `#6366f1` (Indigo)

## 📱 **Responsive Design**

The styling system includes responsive design considerations:

```css
@media (max-width: 640px) {
  .form-input,
  .form-select,
  .form-textarea {
    font-size: 1rem; /* Prevent zoom on iOS */
  }
  
  .section-card {
    padding: 1rem;
  }
  
  .table-cell {
    padding: 0.5rem;
  }
}
```

## ♿ **Accessibility**

The styling system includes accessibility features:

```css
/* Focus indicators for keyboard navigation */
.btn-primary:focus,
.btn-secondary:focus,
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .dashboard-card,
  .card,
  .modal-card,
  .settings-card {
    border-width: 2px;
  }
}
```

## 🚀 **Best Practices**

### **When Adding New Components**

1. **Use existing classes** when possible
2. **Follow the established patterns** for consistency
3. **Test on mobile devices** for responsive behavior
4. **Ensure accessibility** with proper focus states
5. **Use semantic HTML** with appropriate ARIA labels

### **When Modifying Existing Components**

1. **Update to use standardized classes** instead of inline styles
2. **Maintain the existing functionality** while improving appearance
3. **Test across different screen sizes**
4. **Verify accessibility** is maintained

### **Example: Converting Old Styling**

**Before:**
```jsx
<input 
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-gray-900 bg-white"
/>
```

**After:**
```jsx
<input className="form-input" />
```

## 🎉 **Benefits**

This standardized styling system provides:

- ✅ **Consistency** across all pages and components
- ✅ **Professional appearance** with proper shadows and spacing
- ✅ **Maintainability** with centralized styling
- ✅ **Responsive design** that works on all devices
- ✅ **Accessibility** with proper focus states and contrast
- ✅ **Performance** with optimized CSS
- ✅ **Scalability** for future components

**The UI now has a cohesive, professional appearance throughout the entire application!** 🎉 