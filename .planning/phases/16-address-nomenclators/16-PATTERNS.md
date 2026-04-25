# Phase 16: Add Address Nomenclators - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 18 new/modified files
**Analogs found:** 16 / 18

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `frontend/src/data/ro-nomenclator.json` | config/data | static | — | no analog (first JSON data bundle) |
| `frontend/src/components/CountyCityPicker.jsx` | component | request-response | `frontend/src/pages/PostJobPage.jsx` | role-match (select + RHF pattern) |
| `frontend/src/pages/PostJobPage.jsx` | page/form | request-response | self | exact (modified in place) |
| `frontend/src/pages/EditProfilePage.jsx` | page/form | request-response | self | exact (modified in place) |
| `mobile/assets/ro-nomenclator.json` | config/data | static | — | no analog (first JSON data bundle) |
| `mobile/components/CountyCityPickerMobile.tsx` | component | event-driven | `mobile/components/LocationPickerMobile.tsx` | role-match (RN component, FlatList, TouchableOpacity) |
| `mobile/app/(client)/post-job.tsx` | screen/form | request-response | self | exact (modified in place) |
| `mobile/app/(worker)/profile.tsx` | screen/form | request-response | self | exact (modified in place) |
| `backend/HandyLink.Infrastructure/Data/Migrations/004_add_county_field.sql` | migration | batch | `backend/HandyLink.Infrastructure/Data/Migrations/003_add_location_fields.sql` | exact |
| `backend/HandyLink.Core/Entities/Job.cs` | model | CRUD | self | exact (modified in place) |
| `backend/HandyLink.Core/Entities/Profile.cs` | model | CRUD | self | exact (modified in place) |
| `backend/HandyLink.Core/DTOs/CreateJobDto.cs` | model | request-response | self | exact (modified in place) |
| `backend/HandyLink.Core/DTOs/UpdateUserDto.cs` | model | request-response | self | exact (modified in place) |
| `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs` | command | request-response | self | exact (modified in place) |
| `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobHandler.cs` | handler | CRUD | self | exact (modified in place) |
| `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobResponse.cs` | response | request-response | `backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs` | exact |
| `backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs` | response | request-response | self | exact (modified in place) |
| `backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdHandler.cs` | handler | CRUD | self | exact (modified in place) |
| `backend/HandyLink.Core/Services/UserService.cs` | service | CRUD | self | exact (modified in place) |
| `backend/HandyLink.API/Controllers/JobsController.cs` | controller | request-response | self | exact (modified in place) |
| `backend/HandyLink.Tests/Unit/Features/Jobs/CreateJobHandlerTests.cs` | test | request-response | self | exact (modified in place) |

---

## Pattern Assignments

### `frontend/src/data/ro-nomenclator.json` (config/data, static)

No codebase analog — this is the first bundled JSON data asset. Structure per RESEARCH.md:

```json
[
  { "auto": "AB", "nume": "Alba", "cities": ["Alba Iulia", "Aiud", "Blaj"] },
  { "auto": "B",  "nume": "București", "cities": ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"] }
]
```

42 entries total. Copy to `mobile/assets/ro-nomenclator.json` unchanged.

---

### `frontend/src/components/CountyCityPicker.jsx` (component, request-response)

**Analog:** `frontend/src/pages/PostJobPage.jsx`

**Imports pattern** (lines 1-9 of PostJobPage — adapt for component):
```jsx
import { useWatch } from 'react-hook-form';
import nomenclator from '../data/ro-nomenclator.json';
```

**Core select pattern** (PostJobPage.jsx lines 79-88 — category `<select>` with RHF `register`):
```jsx
<select
  {...register('category')}
  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  {CATEGORIES.map(c => (
    <option key={c} value={c}>{c.replace('_', ' ')}</option>
  ))}
</select>
```

**Two-column grid layout** (PostJobPage.jsx lines 89-107):
```jsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium mb-1">City</label>
    <input {...register('city')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
  </div>
  <div>
    <label className="block text-sm font-medium mb-1">Country</label>
    <input {...register('country')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
  </div>
</div>
```

**Component signature — accept RHF props, use `useWatch` for reactive city list:**
```jsx
export default function CountyCityPicker({ register, control, setValue, errors }) {
  const county = useWatch({ control, name: 'county' });
  const cities = county ? (nomenclator.find(c => c.auto === county)?.cities ?? []) : [];
  // ...
}
```

**`setValue` with shouldDirty** (required by Pitfall 5 — EditProfilePage uses `disabled={!isDirty}`):
```jsx
onChange={e => {
  setValue('county', e.target.value, { shouldDirty: true });
  setValue('city', '', { shouldDirty: true });
}}
```

**Disabled state styling** (disabled until county chosen):
```jsx
<select
  {...register('city')}
  disabled={!county}
  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
>
```

**Error display pattern** (PostJobPage.jsx line 65):
```jsx
{errors.county && <p className="text-red-500 text-xs mt-1">{errors.county.message}</p>}
```

---

### `frontend/src/pages/PostJobPage.jsx` (page/form, request-response — modified)

**Analog:** self

**Current Zod schema** (lines 12-20) — extend to add `county`:
```jsx
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(CATEGORIES),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  budgetMin: z.coerce.number().positive().optional().or(z.literal('')),
  budgetMax: z.coerce.number().positive().optional().or(z.literal('')),
});
```
Add `county: z.string().min(1, 'County is required')` to this schema.

**Current RHF setup** (lines 26-29) — add `setValue` to destructure:
```jsx
const { register, handleSubmit, formState: { errors, isSubmitting }, setError, setValue, control } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { country: 'RO', category: 'general' },
});
```

**Payload construction** (lines 31-44) — add `county: data.county`:
```jsx
const payload = {
  title: data.title,
  city: data.city,
  country: data.country,
  // add:
  county: data.county,
  // ...
};
```

**D-05 auto-center handler** (new function to add in PostJobPage):
```jsx
async function handleCitySelect(cityName) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ro&limit=1&q=${encodeURIComponent(cityName + ', Romania')}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data[0]) {
    setLocation({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon), address: cityName });
  }
}
```

**Replace the city/country grid** (lines 89-107) with `<CountyCityPicker>`, passing `onCitySelect={handleCitySelect}`.

---

### `frontend/src/pages/EditProfilePage.jsx` (page/form, request-response — modified)

**Analog:** self

**Current Zod schema** (lines 31-37) — extend with `county`:
```jsx
const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  bio: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
});
```
Add `county: z.string().optional()`.

**isDirty guard on Save** (line 140):
```jsx
<button type="submit" disabled={isSubmitting || !isDirty} ...>
```
This is why `setValue` calls in `CountyCityPicker` MUST pass `{ shouldDirty: true }` (Pitfall 5).

**reset() on load** (lines 48-58) — add `county`:
```jsx
reset({
  fullName: userProfile.full_name ?? '',
  bio: userProfile.bio ?? '',
  city: userProfile.city ?? '',
  county: userProfile.county ?? '',
  country: userProfile.country ?? '',
  phone: userProfile.phone ?? '',
});
```

**Payload to PUT /api/users/me** (lines 65-72) — add `county`:
```jsx
axiosClient.put('/api/users/me', {
  fullName: data.fullName,
  bio: data.bio || null,
  city: data.city || null,
  county: data.county || null,
  country: data.country || null,
  phone: data.phone || null,
  avatarUrl: userProfile?.avatar_url ?? null,
})
```

---

### `mobile/components/CountyCityPickerMobile.tsx` (component, event-driven)

**Analog:** `mobile/components/LocationPickerMobile.tsx`

**Import pattern** (LocationPickerMobile.tsx lines 1-11):
```tsx
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
```
For `CountyCityPickerMobile`, replace with:
```tsx
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal, SafeAreaView, StyleSheet,
} from 'react-native';
import nomenclator from '../assets/ro-nomenclator.json';
import { palette } from '../app/constants/design';
```

**TouchableOpacity field trigger pattern** (LocationPickerMobile.tsx lines 107-111):
```tsx
<TouchableOpacity style={styles.resultItem} onPress={() => selectResult(item)}>
  <Text style={styles.resultText} numberOfLines={2}>{item.label}</Text>
</TouchableOpacity>
```

**FlatList with performance props** (required for city list, Pitfall 3 — iOS jank):
```tsx
<FlatList
  data={cities}
  keyExtractor={item => item}
  initialNumToRender={20}
  maxToRenderPerBatch={20}
  windowSize={5}
  renderItem={({ item }) => (
    <TouchableOpacity onPress={() => { onCityChange(item); setCityModalVisible(false); }}>
      <Text>{item}</Text>
    </TouchableOpacity>
  )}
/>
```

**Styling from profile.tsx** (lines 263-273 — input style to copy for picker trigger field):
```tsx
input: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 10,
  fontSize: 15,
  color: '#111',
  marginBottom: 12,
},
```

**Component prop signature:**
```tsx
type Props = {
  county: string;
  city: string;
  countyLabel: string;
  onCountyChange: (auto: string, name: string) => void;
  onCityChange: (name: string) => void;
};
```

---

### `mobile/app/(client)/post-job.tsx` (screen/form, request-response — modified)

**Analog:** self

**Current city state** (lines 31):
```tsx
const [city, setCity] = useState('');
```
Add alongside: `const [county, setCounty] = useState('');` and `const [countyLabel, setCountyLabel] = useState('');`

**Current city TextInput** (lines 93-101) — replace entirely with `<CountyCityPickerMobile>`:
```tsx
<Text style={styles.label}>City</Text>
<TextInput
  style={styles.input}
  placeholder="e.g. Bucharest"
  value={city}
  onChangeText={setCity}
  autoCapitalize="words"
/>
```
Replace with:
```tsx
<CountyCityPickerMobile
  county={county}
  countyLabel={countyLabel}
  city={city}
  onCountyChange={(auto, name) => { setCounty(auto); setCountyLabel(name); setCity(''); }}
  onCityChange={name => { setCity(name); handleCitySelect(name); }}
/>
```

**Mutation payload** (lines 38-49) — add `county`:
```tsx
api.post('/api/jobs', {
  title, description, city, country: 'RO', county,
  category, budgetMin: ..., budgetMax: ..., latitude: ..., longitude: ..., address: ...
})
```

**D-05 geocode function** (same pattern as Nominatim fetch in LocationPickerMobile.tsx line 51):
```tsx
async function handleCitySelect(cityName: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ro&limit=1&q=${encodeURIComponent(cityName + ', Romania')}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'HandyLink/1.0' } });
  const data = await res.json();
  if (data[0]) {
    setLocation({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon), address: cityName });
  }
}
```

---

### `mobile/app/(worker)/profile.tsx` (screen/form, request-response — modified)

**Analog:** self

**Current city state and edit TextInput** (lines 57, 137-143):
```tsx
const [city, setCity] = useState('');
// ...
<Text style={styles.label}>City</Text>
<TextInput style={styles.input} value={city} onChangeText={setCity} autoCapitalize="words" />
```
Add `county` and `countyLabel` state alongside `city`. Replace TextInput with `<CountyCityPickerMobile>`.

**onSuccess populates state** (lines 63-65):
```tsx
onSuccess: (data: any) => {
  setName(data.fullName ?? data.full_name ?? '');
  setCity(data.city ?? '');
},
```
Extend to also set county from `data.county ?? ''`.

**Mutation payload** (line 69):
```tsx
mutationFn: () => api.put('/api/users/me', { full_name: name, city }),
```
Add `county` to the payload object.

**Display row pattern** (lines 167-170 — add county display row):
```tsx
<View style={styles.infoRow}>
  <Text style={styles.infoLabel}>City</Text>
  <Text style={styles.infoValue}>{displayCity || '—'}</Text>
</View>
```
Add equivalent row for county above city row.

---

### `backend/HandyLink.Infrastructure/Data/Migrations/004_add_county_field.sql` (migration, batch)

**Analog:** `backend/HandyLink.Infrastructure/Data/Migrations/003_add_location_fields.sql`

**Exact pattern to copy** (003_add_location_fields.sql lines 1-13):
```sql
-- Migration 003: Add location fields to jobs and worker_profiles
-- Run in: Supabase Dashboard > SQL Editor > New Query

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS latitude  DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS address   TEXT;

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS latitude          DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS longitude         DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS service_radius_km INTEGER;
```

New file follows same structure:
```sql
-- Migration 004: Add county field to jobs and profiles
-- Run in: Supabase Dashboard > SQL Editor > New Query

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS county TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS county TEXT;
```

Note: migration targets `public.profiles` (not `public.worker_profiles`) for the profile county column — `Profile.cs` entity maps to the `profiles` table.

---

### `backend/HandyLink.Core/Entities/Job.cs` (model, CRUD — modified)

**Analog:** self

**Current optional nullable string fields pattern** (Job.cs lines 19, 20):
```csharp
public string? Address { get; set; }
```
Add after `Address`:
```csharp
public string? County { get; set; }
```

---

### `backend/HandyLink.Core/Entities/Profile.cs` (model, CRUD — modified)

**Analog:** self

**Current optional string pattern** (Profile.cs lines 9-10):
```csharp
public string? City { get; set; }
public string Country { get; set; } = "RO";
```
Add `County` between `City` and `Country`:
```csharp
public string? City { get; set; }
public string? County { get; set; }
public string Country { get; set; } = "RO";
```

---

### `backend/HandyLink.Core/DTOs/CreateJobDto.cs` (model, request-response — modified)

**Analog:** self

**Current positional record** (CreateJobDto.cs lines 1-16):
```csharp
public record CreateJobDto(
    string Title, string Description, JobCategory Category,
    string City, string Country,
    decimal? BudgetMin, decimal? BudgetMax, string[]? Photos,
    decimal? Latitude, decimal? Longitude, string? Address);
```
Add `string? County` after `string Country` to keep all nullable/optional params together:
```csharp
public record CreateJobDto(
    string Title, string Description, JobCategory Category,
    string City, string Country, string? County,
    decimal? BudgetMin, decimal? BudgetMax, string[]? Photos,
    decimal? Latitude, decimal? Longitude, string? Address);
```

---

### `backend/HandyLink.Core/DTOs/UpdateUserDto.cs` (model, request-response — modified)

**Analog:** self

**Current record** (UpdateUserDto.cs):
```csharp
public record UpdateUserDto(
    string? FullName, string? AvatarUrl, string? Phone,
    string? City, string? Country, string? Bio, string? ExpoPushToken);
```
Add `string? County` after `string? City`:
```csharp
public record UpdateUserDto(
    string? FullName, string? AvatarUrl, string? Phone,
    string? City, string? County, string? Country, string? Bio, string? ExpoPushToken);
```
**WARNING:** This is a positional record — all callers must be updated in the same commit. Search for `new UpdateUserDto(` in the codebase.

---

### `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs` (command, request-response — modified)

**Analog:** self

**Current record** (CreateJobCommand.cs lines 6-19):
```csharp
public record CreateJobCommand(
    Guid ClientId, string Title, string Description, JobCategory Category,
    string City, string Country,
    string[]? Photos, decimal? BudgetMin, decimal? BudgetMax,
    decimal? Latitude, decimal? Longitude, string? Address
) : IRequest<CreateJobResponse>;
```
Add `string? County` after `string Country`:
```csharp
public record CreateJobCommand(
    Guid ClientId, string Title, string Description, JobCategory Category,
    string City, string Country, string? County,
    string[]? Photos, decimal? BudgetMin, decimal? BudgetMax,
    decimal? Latitude, decimal? Longitude, string? Address
) : IRequest<CreateJobResponse>;
```
**WARNING (Pitfall 2):** All positional call sites must be updated — `JobsController.cs` line 25 and `CreateJobHandlerTests.cs` lines 32-33 and 53-54.

---

### `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobHandler.cs` (handler, CRUD — modified)

**Analog:** self

**Current entity initialization** (CreateJobHandler.cs lines 13-31):
```csharp
var job = new Job
{
    Id = Guid.NewGuid(),
    ClientId = command.ClientId,
    Title = command.Title,
    Description = command.Description,
    Category = command.Category,
    City = command.City,
    Country = command.Country,
    Photos = command.Photos ?? [],
    BudgetMin = command.BudgetMin,
    BudgetMax = command.BudgetMax,
    Latitude = command.Latitude,
    Longitude = command.Longitude,
    Address = command.Address,
    Status = JobStatus.Open,
    CreatedAt = DateTimeOffset.UtcNow,
    UpdatedAt = DateTimeOffset.UtcNow
};
```
Add `County = command.County,` after `Country = command.Country,`.

**Current response construction** (lines 36-39):
```csharp
return new CreateJobResponse(job.Id, job.ClientId, job.Title, job.Description,
    job.Category.ToString(), job.City, job.Country,
    job.BudgetMin, job.BudgetMax, job.Status, job.CreatedAt,
    job.Latitude, job.Longitude, job.Address);
```
Add `job.County` to positional args after `job.Country`.

---

### `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobResponse.cs` (response, request-response — modified)

**Analog:** `backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs`

**Current record** (CreateJobResponse.cs):
```csharp
public record CreateJobResponse(
    Guid Id, Guid ClientId, string Title, string Description, string Category,
    string City, string Country,
    decimal? BudgetMin, decimal? BudgetMax, JobStatus Status, DateTimeOffset CreatedAt,
    decimal? Latitude, decimal? Longitude, string? Address);
```
Add `string? County` after `string Country`:
```csharp
public record CreateJobResponse(
    Guid Id, Guid ClientId, string Title, string Description, string Category,
    string City, string Country, string? County,
    decimal? BudgetMin, decimal? BudgetMax, JobStatus Status, DateTimeOffset CreatedAt,
    decimal? Latitude, decimal? Longitude, string? Address);
```

---

### `backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdResponse.cs` (response, request-response — modified)

**Analog:** self

**Current record** (GetJobByIdResponse.cs):
```csharp
public record GetJobByIdResponse(
    Guid Id, Guid ClientId, string Title, string Description, string Category,
    string City, string Country, string[] Photos,
    decimal? BudgetMin, decimal? BudgetMax, string Status, DateTimeOffset CreatedAt,
    decimal? Latitude, decimal? Longitude, string? Address);
```
Add `string? County` after `string Country`:
```csharp
public record GetJobByIdResponse(
    Guid Id, Guid ClientId, string Title, string Description, string Category,
    string City, string Country, string? County, string[] Photos,
    decimal? BudgetMin, decimal? BudgetMax, string Status, DateTimeOffset CreatedAt,
    decimal? Latitude, decimal? Longitude, string? Address);
```

---

### `backend/HandyLink.API/Features/Jobs/GetJobById/GetJobByIdHandler.cs` (handler, CRUD — modified)

**Analog:** self

**Current response construction** (GetJobByIdHandler.cs lines 17-20):
```csharp
return new GetJobByIdResponse(job.Id, job.ClientId, job.Title, job.Description,
    job.Category.ToString(), job.City, job.Country, job.Photos,
    job.BudgetMin, job.BudgetMax, job.Status.ToString(), job.CreatedAt,
    job.Latitude, job.Longitude, job.Address);
```
Add `job.County` positionally after `job.Country`:
```csharp
return new GetJobByIdResponse(job.Id, job.ClientId, job.Title, job.Description,
    job.Category.ToString(), job.City, job.Country, job.County, job.Photos,
    job.BudgetMin, job.BudgetMax, job.Status.ToString(), job.CreatedAt,
    job.Latitude, job.Longitude, job.Address);
```

---

### `backend/HandyLink.Core/Services/UserService.cs` (service, CRUD — modified)

**Analog:** self

**Current UpdateCurrentUserAsync mapping pattern** (UserService.cs lines 44-57):
```csharp
public async Task<UserResponseDto> UpdateCurrentUserAsync(Guid userId, UpdateUserDto dto, CancellationToken ct = default)
{
    var profile = await profiles.GetByIdTrackedAsync(userId, ct)
        ?? throw new NotFoundException($"User {userId} not found");
    if (dto.FullName is not null) profile.FullName = dto.FullName;
    if (dto.AvatarUrl is not null) profile.AvatarUrl = dto.AvatarUrl;
    if (dto.Phone is not null) profile.Phone = dto.Phone;
    if (dto.City is not null) profile.City = dto.City;
    if (dto.Country is not null) profile.Country = dto.Country;
    if (dto.Bio is not null) profile.Bio = dto.Bio;
    if (dto.ExpoPushToken is not null) profile.ExpoPushToken = dto.ExpoPushToken;
    profile.UpdatedAt = DateTimeOffset.UtcNow;
    await profiles.SaveChangesAsync(ct);
    return ToDto(profile);
}
```
Add `if (dto.County is not null) profile.County = dto.County;` after the `City` line.

**ToDto** (UserService.cs line 60-61):
```csharp
private static UserResponseDto ToDto(Profile p) => new(
    p.Id, p.FullName, p.AvatarUrl, p.Phone, p.City, p.Country, p.Bio, p.Role, p.CreatedAt);
```
Add `p.County` positionally if `UserResponseDto` gains a `County` field (check all callers if added).

---

### `backend/HandyLink.API/Controllers/JobsController.cs` (controller, request-response — modified)

**Analog:** self

**Current CreateJob mediator call** (JobsController.cs lines 24-26):
```csharp
var result = await mediator.Send(new CreateJobCommand(
    GetUserId(), dto.Title, dto.Description, dto.Category, dto.City, dto.Country, dto.Photos, dto.BudgetMin, dto.BudgetMax,
    dto.Latitude, dto.Longitude, dto.Address), ct);
```
Add `dto.County` after `dto.Country`:
```csharp
var result = await mediator.Send(new CreateJobCommand(
    GetUserId(), dto.Title, dto.Description, dto.Category, dto.City, dto.Country, dto.County, dto.Photos, dto.BudgetMin, dto.BudgetMax,
    dto.Latitude, dto.Longitude, dto.Address), ct);
```

---

### `backend/HandyLink.Tests/Unit/Features/Jobs/CreateJobHandlerTests.cs` (test, request-response — modified)

**Analog:** self

**Current positional CreateJobCommand calls** (lines 32-33 and 53-54):
```csharp
var cmd = new CreateJobCommand(clientId, "Fix my sink", "Leaking badly",
    JobCategory.Plumbing, "Bucharest", "RO", null, 100, 300, null, null, null);

var cmd = new CreateJobCommand(clientId, "Paint wall", "Big wall",
    JobCategory.Painting, "Cluj", "RO", null, 50, 200, null, null, null);
```
After adding `County` as the 7th positional parameter (after `Country`), update both calls to pass `null` for county:
```csharp
var cmd = new CreateJobCommand(clientId, "Fix my sink", "Leaking badly",
    JobCategory.Plumbing, "Bucharest", "RO", null, null, 100, 300, null, null, null);
```

---

## Shared Patterns

### RHF `register` + `setValue` + Zod error display
**Source:** `frontend/src/pages/PostJobPage.jsx` lines 26-29, 62-66
**Apply to:** `CountyCityPicker.jsx`, `PostJobPage.jsx` (modified), `EditProfilePage.jsx` (modified)
```jsx
const { register, handleSubmit, formState: { errors, isSubmitting }, setError, setValue, control } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { country: 'RO', category: 'general' },
});
// ...
{errors.fieldName && <p className="text-red-500 text-xs mt-1">{errors.fieldName.message}</p>}
```

### Mobile `useState` + `useMutation` form pattern
**Source:** `mobile/app/(client)/post-job.tsx` lines 28-58
**Apply to:** `post-job.tsx` (modified), `profile.tsx` (modified)
```tsx
const [city, setCity] = useState('');
const { mutate, isPending } = useMutation({
  mutationFn: () => api.post('/api/jobs', { city, ... }),
  onSuccess: () => { queryClient.invalidateQueries(...); router.back(); },
  onError: (err: any) => { Alert.alert('Error', err?.response?.data?.error ?? 'Failed.'); },
});
```

### Mobile input/field StyleSheet
**Source:** `mobile/app/(client)/post-job.tsx` lines 169-179 and `mobile/app/(worker)/profile.tsx` lines 263-273
**Apply to:** `CountyCityPickerMobile.tsx`
```tsx
input: {
  borderWidth: 1,
  borderColor: palette.border,
  borderRadius: 10,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  color: palette.text,
  marginBottom: 16,
  backgroundColor: palette.panel,
},
```

### Positional record extension (C# backend)
**Source:** `backend/HandyLink.API/Features/Jobs/CreateJob/CreateJobCommand.cs`, `CreateJobResponse.cs`, `GetJobByIdResponse.cs`
**Apply to:** All modified response/command/DTO records
**Rule:** Add `string? County` after `string Country` in every positional record. Update ALL call sites in the same change — the compiler will surface them as errors.

### SQL migration header pattern
**Source:** `backend/HandyLink.Infrastructure/Data/Migrations/003_add_location_fields.sql` lines 1-2
**Apply to:** `004_add_county_field.sql`
```sql
-- Migration 004: Add county field to jobs and profiles
-- Run in: Supabase Dashboard > SQL Editor > New Query
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `frontend/src/data/ro-nomenclator.json` | config/data | static | No existing bundled JSON data asset in the frontend |
| `mobile/assets/ro-nomenclator.json` | config/data | static | No existing bundled JSON data asset in mobile |

---

## Key Warnings (from Pitfall Analysis)

1. **Pitfall 2 — Positional record breakage:** `CreateJobCommand`, `CreateJobResponse`, `GetJobByIdResponse`, `CreateJobDto`, `UpdateUserDto` are all positional C# records. Every call site must be updated atomically. Key affected: `JobsController.cs` line 25, `CreateJobHandlerTests.cs` lines 32 and 53, `GetJobByIdHandler.cs` lines 17-20.

2. **Pitfall 5 — isDirty not triggered:** `EditProfilePage` uses `disabled={!isDirty}` on Save. `CountyCityPicker` must call `setValue('county', v, { shouldDirty: true })` and `setValue('city', v, { shouldDirty: true })`.

3. **Pitfall 3 — iOS FlatList jank:** City `FlatList` in `CountyCityPickerMobile` must use `initialNumToRender={20}`, `maxToRenderPerBatch={20}`, `windowSize={5}`.

4. **Country field stays:** `country` field is NOT removed from any form, entity, DTO, or command. Phase 16 adds `county` alongside existing `country`.

---

## Metadata

**Analog search scope:** `frontend/src/`, `mobile/app/`, `mobile/components/`, `backend/HandyLink.API/Features/`, `backend/HandyLink.Core/`, `backend/HandyLink.Infrastructure/Data/Migrations/`, `backend/HandyLink.Tests/`
**Files scanned:** 21 source files read directly
**Pattern extraction date:** 2026-04-24
