# Project Knowledge Base

This document contains essential documentation and patterns for working with the backend and admin projects.

---

## Project Stack Overview

### Backend (`/backend`)
- **Framework**: FastAPI (Python 3.12+)
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Database**: PostgreSQL (asyncpg), MongoDB (motor)
- **Migrations**: Alembic
- **Caching**: Redis
- **Authentication**: JWT (python-jose)
- **Rate Limiting**: SlowAPI
- **CLI**: Typer

### Admin (`/admin`)
- **Framework**: TanStack Start (React 19)
- **Router**: TanStack Router (file-based, type-safe)
- **Forms**: TanStack Form + Zod
- **Tables**: TanStack Table
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn UI (Radix UI based)
- **Build Tool**: Vite 7

---

## Backend Documentation

### FastAPI - API Routes & Authentication

#### Basic Endpoint with Pydantic Model
```python
from fastapi import FastAPI
from pydantic import BaseModel

class Item(BaseModel):
    name: str
    description: str | None = None

app = FastAPI()

@app.post("/items/")
def create_item(item: Item):
    return {"message": "Item created"}
```

#### OAuth2 Authentication with JWT
```python
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.security import (
    OAuth2PasswordBearer,
    OAuth2PasswordRequestForm,
    SecurityScopes,
)
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from pydantic import BaseModel, ValidationError

# Token endpoint
@app.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Token:
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "scope": " ".join(form_data.scopes)},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")

# Protected endpoint
@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Endpoint with scopes
@app.get("/users/me/items/")
async def read_own_items(
    current_user: User = Security(get_current_active_user, scopes=["items"]),
):
    return [{"item_id": "Foo", "owner": current_user.username}]
```

#### Pydantic Models Pattern (Request/Response Separation)
```python
# UserIn - validates incoming requests
class UserIn(BaseModel):
    username: str
    password: str
    email: EmailStr
    full_name: str | None = None

# UserOut - API response (excludes sensitive fields)
class UserOut(BaseModel):
    username: str
    email: EmailStr
    full_name: str | None = None

# UserInDB - internal database model
class UserInDB(BaseModel):
    username: str
    hashed_password: str
    email: EmailStr
    full_name: str | None = None
```

---

### SQLModel - ORM Patterns

#### One-to-Many Relationship
```python
from sqlmodel import Field, Relationship, SQLModel

class Team(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    headquarters: str
    heroes: list["Hero"] = Relationship(back_populates="team")

class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    secret_name: str
    age: int | None = Field(default=None, index=True)
    team_id: int | None = Field(default=None, foreign_key="team.id")
    team: Team | None = Relationship(back_populates="heroes")
```

#### Many-to-Many with Link Table (Extra Fields)
```python
from sqlmodel import Field, Relationship, SQLModel

class HeroTeamLink(SQLModel, table=True):
    team_id: int | None = Field(default=None, foreign_key="team.id", primary_key=True)
    hero_id: int | None = Field(default=None, foreign_key="hero.id", primary_key=True)
    is_training: bool = False

    team: "Team" = Relationship(back_populates="hero_links")
    hero: "Hero" = Relationship(back_populates="team_links")

class Team(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    headquarters: str
    hero_links: list[HeroTeamLink] = Relationship(back_populates="team")

class Hero(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    secret_name: str
    age: int | None = Field(default=None, index=True)
    team_links: list[HeroTeamLink] = Relationship(back_populates="hero")
```

#### CRUD Operations with Session
```python
from sqlmodel import Session, create_engine

engine = create_engine("sqlite:///database.db")

def create_heroes():
    with Session(engine) as session:
        team = Team(name="Preventers", headquarters="Sharp Tower")
        hero = Hero(name="Deadpond", secret_name="Dive Wilson", team=team)

        session.add(team)
        session.add(hero)
        session.commit()

        session.refresh(team)
        session.refresh(hero)
```

---

## Admin (Frontend) Documentation

### TanStack Router - File-Based Routing

#### Route Definition with Search Params
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const productSearchSchema = z.object({
  page: z.number().optional(),
})

export const Route = createFileRoute('/shop/products/$productId')({
  validateSearch: productSearchSchema,
})
```

#### Navigation with Search Params
```tsx
import { useNavigate, createFileRoute } from '@tanstack/react-router'

const ProductList = () => {
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <button
      onClick={() => {
        navigate({
          search: (prev) => ({ page: prev.page + 1 }),
        })
      }}
    >
      Next Page
    </button>
  )
}
```

#### Type-Safe Route Hooks
```tsx
export const Route = createFileRoute('/posts')({
  component: PostsComponent,
})

function PostsComponent() {
  // Type-safe hooks from the route
  const params = Route.useParams()
  const search = Route.useSearch()

  // For router-wide context, use `from` param
  const navigate = useNavigate({ from: Route.fullPath })
}
```

#### Retain Search Params
```tsx
import { z } from 'zod'
import { createFileRoute, retainSearchParams } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'

const searchSchema = z.object({
  one: z.string().optional(),
  two: z.string().optional(),
})

export const Route = createFileRoute('/')({
  validateSearch: zodValidator(searchSchema),
  search: {
    middlewares: [retainSearchParams(true)],
  },
})
```

---

### TanStack Start - Server Functions & SSR

#### Server Function with Input Validation
```typescript
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const fetchUserData = createServerFn()
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const response = await fetch(
      `${process.env.EXTERNAL_API_URL}/users/${data.userId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.EXTERNAL_API_SECRET}`,
          'Content-Type': 'application/json',
        },
      },
    )
    return response.json()
  })
```

#### Using Server Functions in Routes
```tsx
// In a route loader
export const Route = createFileRoute('/posts')({
  loader: () => getPosts(),
})

// In a component with useQuery
function PostList() {
  const getPosts = useServerFn(getServerPosts)

  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: () => getPosts(),
  })
}
```

#### SSR Configuration
```tsx
// Enable full SSR for a route
export const Route = createFileRoute('/posts/$postId')({
  ssr: true,
  beforeLoad: () => {
    console.log('Executes on server during initial request')
  },
  loader: () => {
    console.log('Executes on server during initial request')
  },
  component: () => <div>Server rendered</div>,
})
```

#### Global Middleware
```tsx
// src/start.ts
import { createStart, createMiddleware } from '@tanstack/react-start'

const myGlobalMiddleware = createMiddleware().server(() => {
  // Runs for every request
})

export const startInstance = createStart(() => ({
  requestMiddleware: [myGlobalMiddleware],
}))
```

---

### TanStack Form - Form Handling

#### Basic Form with Validation
```tsx
import { useForm } from '@tanstack/react-form'
import type { AnyFieldApi } from '@tanstack/react-form'

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>{field.state.meta.errors.join(', ')}</em>
      ) : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  )
}

export default function App() {
  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="firstName"
        validators={{
          onChange: ({ value }) =>
            !value
              ? 'A first name is required'
              : value.length < 3
                ? 'First name must be at least 3 characters'
                : undefined,
          onChangeAsyncDebounceMs: 500,
          onChangeAsync: async ({ value }) => {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            return value.includes('error') && 'No "error" allowed'
          },
        }}
        children={(field) => (
          <>
            <label htmlFor={field.name}>First Name:</label>
            <input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldInfo field={field} />
          </>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? '...' : 'Submit'}
          </button>
        )}
      />
    </form>
  )
}
```

#### Form with Zod Schema Validation
```tsx
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

function RegistrationForm() {
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    validators: {
      onChange: z.object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
        acceptTerms: z.boolean(),
      }),
      onSubmit: ({ value }) => {
        if (value.password !== value.confirmPassword) {
          return {
            form: 'Passwords do not match',
            fields: { confirmPassword: 'Must match password' },
          }
        }
        if (!value.acceptTerms) {
          return { fields: { acceptTerms: 'You must accept terms' } }
        }
        return undefined
      },
    },
    onSubmit: async ({ value }) => {
      await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify(value),
      })
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field
        name="username"
        children={(field) => (
          <div>
            <label htmlFor={field.name}>Username</label>
            <input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.map((error, i) => (
              <p key={i} style={{ color: 'red' }}>{error}</p>
            ))}
          </div>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? 'Submitting...' : 'Register'}
          </button>
        )}
      />
    </form>
  )
}
```

---

### TanStack Table - Data Tables

#### Basic Table with Sorting, Filtering, Pagination
```tsx
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

function App() {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      { accessorKey: 'firstName', cell: (info) => info.getValue() },
      { accessorKey: 'lastName', header: () => <span>Last Name</span> },
      { accessorKey: 'age', header: () => 'Age', meta: { filterVariant: 'range' } },
      { accessorKey: 'status', header: 'Status', meta: { filterVariant: 'select' } },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, pagination },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} colSpan={header.colSpan}>
                <div
                  className={header.column.getCanSort() ? 'cursor-pointer' : ''}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                </div>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

#### Server-Side Data with Controlled State
```tsx
const [columnFilters, setColumnFilters] = React.useState([])
const [sorting, setSorting] = React.useState([{ id: 'age', desc: true }])
const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 15 })

// Fetch data when state changes
const tableQuery = useQuery({
  queryKey: ['users', columnFilters, sorting, pagination],
  queryFn: () => fetchUsers(columnFilters, sorting, pagination),
})

const table = useReactTable({
  columns,
  data: tableQuery.data,
  state: { columnFilters, sorting, pagination },
  onColumnFiltersChange: setColumnFilters,
  onSortingChange: setSorting,
  onPaginationChange: setPagination,
})
```

#### Row Selection
```tsx
const [rowSelection, setRowSelection] = React.useState({})

const columns = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  },
  // ... other columns
]

const table = useReactTable({
  data,
  columns,
  state: { rowSelection },
  enableRowSelection: true,
  onRowSelectionChange: setRowSelection,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})
```

---

### Tailwind CSS v4 - Styling

#### Dark Mode with `dark:` Variant
```html
<div class="bg-white dark:bg-gray-800 rounded-lg px-6 py-8 shadow-xl">
  <h3 class="text-gray-900 dark:text-white text-base font-medium">Title</h3>
  <p class="text-gray-500 dark:text-gray-400 text-sm">Description text</p>
</div>
```

#### Responsive Card Component
```html
<div class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg
            outline outline-black/5 dark:bg-slate-800 dark:shadow-none
            dark:-outline-offset-1 dark:outline-white/10">
  <img class="size-12 shrink-0" src="/img/logo.svg" alt="Logo" />
  <div>
    <div class="text-xl font-medium text-black dark:text-white">Title</div>
    <p class="text-gray-500 dark:text-gray-400">Subtitle text</p>
  </div>
</div>
```

#### Custom Theme Colors with CSS Variables
```css
@theme {
  --color-regal-blue: #243c5a;
}
```
```html
<p class="text-regal-blue">Custom colored text</p>
```

---

### Shadcn UI - Component Patterns

#### Card Component (Login Form)
```tsx
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>Enter your email below to login</CardDescription>
        <CardAction>
          <Button variant="link">Sign Up</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">Login</Button>
        <Button variant="outline" className="w-full">Login with Google</Button>
      </CardFooter>
    </Card>
  )
}
```

#### Form with React Hook Form + Zod
```tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

export function ProfileForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "" },
  })

  function onSubmit(values) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>Your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

#### Installing Shadcn Components
```bash
# Install specific components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add table
```

---

## Context7 Library IDs Reference

For fetching up-to-date documentation:

| Library | Context7 ID | Description |
|---------|-------------|-------------|
| FastAPI | `/websites/fastapi_tiangolo` | Python web framework |
| SQLModel | `/websites/sqlmodel_tiangolo` | SQLAlchemy + Pydantic ORM |
| TanStack Router | `/websites/tanstack_router` | Type-safe React routing |
| TanStack Start | `/websites/tanstack_start` | React SSR framework |
| TanStack Form | `/tanstack/form` | Headless form library |
| TanStack Table | `/websites/tanstack_table` | Headless table library |
| Tailwind CSS | `/websites/tailwindcss` | Utility-first CSS |
| Shadcn UI | `/websites/ui_shadcn` | React component library |

---

## Quick Reference Commands

### Backend
```bash
# Run development server
cd backend && uv run uvicorn main:app --reload

# Run migrations
cd backend && uv run alembic upgrade head

# Create new migration
cd backend && uv run alembic revision --autogenerate -m "description"

# Run tests
cd backend && uv run pytest
```

### Admin
```bash
# Run development server
cd admin && npm run dev

# Build for production
cd admin && npm run build

# Run tests
cd admin && npm run test

# Lint and format
cd admin && npm run check
```
