# Skills Selection UI Preview

## 🎯 Edit Mode - Specializations Section

### 1️⃣ **Search & Browse View** (Empty search)
```
┌─────────────────────────────────────────────────────────────┐
│ Specializations                                              │
├─────────────────────────────────────────────────────────────┤
│ Search and add skills...                        [input field]│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 📐 Mathematics                                     [sticky]││
│ │ ├─ Basic Mathematics                                     ││
│ │ ├─ Algebra                                              ││
│ │ ├─ Trigonometry                                         ││
│ │ └─ ... more                                             ││
│ │                                                          ││
│ │ 🔬 Science                                        [sticky]││
│ │ ├─ Physics                                              ││
│ │ ├─ Chemistry                                            ││
│ │ └─ ... more                                             ││
│ │                                                          ││
│ │ 💻 Computer Science & IT                         [sticky]││
│ │ ├─ Python                                               ││
│ │ ├─ React.js                                             ││
│ │ ├─ Node.js                                              ││
│ │ └─ ... 30+ skills                                       ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Or add custom skill  [input field]    [Add Custom] button   │
│                                                              │
│ Skills selected: 0/10                                        │
│                                                              │
│ (No skills selected yet)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 2️⃣ **Search Results** (User types "python")
```
┌─────────────────────────────────────────────────────────────┐
│ Specializations                                              │
├─────────────────────────────────────────────────────────────┤
│ python                                           [input field]│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ► Python                          [click to add]         ││
│ │ ► Python                          [already selected]     ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Or add custom skill  [input field]    [Add Custom] button   │
│                                                              │
│ Skills selected: 1/10                                        │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ● Python                                           [×]   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3️⃣ **Selected Skills Display** (3 skills added)
```
┌─────────────────────────────────────────────────────────────┐
│ Specializations                                              │
├─────────────────────────────────────────────────────────────┤
│ Search and add skills...                        [input field]│
│                                                              │
│ [Dropdown showing categories/search results]                │
│                                                              │
│ Or add custom skill  [input field]    [Add Custom] button   │
│                                                              │
│ Skills selected: 3/10                                        │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ● Python [×]  ● React.js [×]  ● Machine Learning [×]  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4️⃣ **Maximum Skills Reached** (10/10 selected)
```
┌─────────────────────────────────────────────────────────────┐
│ Specializations                                              │
├─────────────────────────────────────────────────────────────┤
│ Search and add skills... [DISABLED - grayed out]            │
│                                                              │
│ Or add custom skill  [DISABLED - grayed out]  [DISABLED]    │
│                                                              │
│ Skills selected: 10/10                                       │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ● Python [×]        ● React.js [×]                    │ │
│ │ ● Node.js [×]       ● MongoDB [×]                     │ │
│ │ ● TypeScript [×]    ● Docker [×]                      │ │
│ │ ● GraphQL [×]       ● AWS [×]                         │ │
│ │ ● Machine Learning [×]  ● AI [×]                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📖 Read-Only Mode - Profile Display View

```
┌─────────────────────────────────────────────────────────────┐
│ Specializations                                              │
├─────────────────────────────────────────────────────────────┤
│ ● Python     ● React.js     ● Node.js     ● MongoDB        │
│ ● TypeScript ● Docker       ● GraphQL     ● AWS            │
│ ● Machine Learning          ● Data Science                 │
└─────────────────────────────────────────────────────────────┘
```

### Empty State:
```
┌─────────────────────────────────────────────────────────────┐
│ Specializations                                              │
├─────────────────────────────────────────────────────────────┤
│ No specializations added yet                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Scheme & Styling

| Element | Color | Styling |
|---------|-------|---------|
| Category Header | Light Gray bg (`bg-slate-100`) | Bold, sticky top |
| Skill Item (hover) | Light Blue (`hover:bg-blue-50`) | Clickable, cursor-pointer |
| Selected Chip | Blue bg (`bg-blue-100`) | Blue border, rounded pill |
| Remove Button | Red text (`text-red-600`) | Hover darker red |
| Counter Text | Gray (`text-slate-600`) | Small, informational |
| Input Focus | Blue ring (`focus:ring-blue-500`) | 2px ring effect |
| Disabled State | Gray (`bg-slate-400`) | Faded, no cursor |

---

## ⌨️ Keyboard Interaction

| Key | Action |
|-----|--------|
| **Click/Tap** | Toggle dropdown, select skill, remove chip |
| **Focus** | Highlights input, shows dropdown |
| **Type** | Filters skills in real-time |
| **Enter** | Adds custom skill or submitted search |
| **Escape** | (Click outside) Auto-closes dropdown |

---

## 📱 Responsive Behavior

- **Desktop**: Full width with multi-column chip layout
- **Tablet**: Adjusted spacing, single-column chips
- **Mobile**: Stack vertically, full-width inputs
- **All screens**: Dropdown scrolls if >80 items visible

---

## 🎯 User Journey

1. **User clicks "Edit Profile"**
   ↓
2. **Scrolls to Specializations section**
   ↓
3. **Sees search input with placeholder text**
   ↓
4. **Option A: Browse Categories**
   - Click search box → See all categories
   - Click skill → Added to chips
   
5. **Option B: Search Skills**
   - Type skill name → Real-time filtering
   - Click result → Added to chips
   
6. **Option C: Custom Skill**
   - Type in custom field → Click "Add Custom"
   - Appears in chips
   
7. **Remove if needed**
   - Click [×] on any chip → Skill removed
   
8. **Save Profile**
   - Click "Save Changes" → Data persists
   - Backend receives array of skill strings

---

## ✅ Validation Rules

- ✅ Max 10 skills enforced
- ✅ No duplicate skills allowed
- ✅ Custom skills validated (non-empty)
- ✅ Already selected skills hidden from dropdown
- ✅ Changes only persist on "Save Changes" click

---

**Implementation Status**: ✅ Complete and Ready for Use
