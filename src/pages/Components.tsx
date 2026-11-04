import { useState, type ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Text from '../components/ui/Text'
import Checkbox from '../components/ui/Checkbox'
import RadioGroup from '../components/ui/RadioGroup'
import Switch from '../components/ui/Switch'
import Dropdown from '../components/ui/Dropdown'
import ButtonGroup from '../components/ui/ButtonGroup'
import MultiSelect from '../components/ui/MultiSelect'
import SearchableSelect from '../components/ui/SearchableSelect'
import ChipFilter from '../components/ui/ChipFilter'
import RangeSlider from '../components/ui/RangeSlider'
import Modal from '../components/ui/Modal'
import Tabs from '../components/ui/Tabs'
import BoxContainer from '../components/ui/BoxContainer'
import ImageUpload from '../components/ui/ImageUpload'
import Table, { type Column } from '../components/ui/Table'
import Badge from '../components/ui/Badge'
import CopyCell from '../components/ui/CopyCell'
import Tooltip from '../components/ui/Tooltip'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'
import DivergingBarChart from '../components/charts/DivergingBarChart'
import PieChart from '../components/charts/PieChart'
import Calendar from '../components/ui/Calendar'
import DatePicker from '../components/ui/DatePicker'
import DateRangePicker, {
  type DateRange,
} from '../components/ui/DateRangePicker'

type ProductRow = {
  id: number
  name: string
  category: string
  price: number
  status: 'active' | 'low' | 'out'
}

const SALES_DATA = [
  { month: 'Jun', revenue: 42000, orders: 120 },
  { month: 'Jul', revenue: 51000, orders: 145 },
  { month: 'Aug', revenue: 48000, orders: 138 },
  { month: 'Sep', revenue: 61000, orders: 172 },
  { month: 'Oct', revenue: 73000, orders: 205 },
  { month: 'Nov', revenue: 69000, orders: 198 },
]

const CATEGORY_DATA = [
  { category: 'Silk', sold: 320, returned: 18 },
  { category: 'Cotton', sold: 280, returned: 12 },
  { category: 'Designer', sold: 190, returned: 22 },
  { category: 'Banarasi', sold: 150, returned: 9 },
  { category: 'Organza', sold: 110, returned: 6 },
]

const PROFIT_DATA = [
  { month: 'Jun', net: 12000 },
  { month: 'Jul', net: 18000 },
  { month: 'Aug', net: -4000 },
  { month: 'Sep', net: 9000 },
  { month: 'Oct', net: -2500 },
  { month: 'Nov', net: 15000 },
]

const SHARE_DATA = [
  { name: 'Silk', value: 320 },
  { name: 'Cotton', value: 280 },
  { name: 'Designer', value: 190 },
  { name: 'Banarasi', value: 150 },
  { name: 'Organza', value: 110 },
]

const PRODUCTS: ProductRow[] = [
  { id: 1, name: 'Kanjivaram Royal Silk', category: 'Silk', price: 8499, status: 'active' },
  { id: 2, name: 'Banarasi Zari Weave', category: 'Banarasi', price: 6999, status: 'low' },
  { id: 3, name: 'Organza Floral Drape', category: 'Organza', price: 4299, status: 'out' },
  { id: 4, name: 'Handloom Cotton Classic', category: 'Cotton', price: 2799, status: 'active' },
]

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-6">{children}</div>
    </section>
  )
}

export default function Components() {
  const [checked, setChecked] = useState(true)
  const [radio, setRadio] = useState('standard')
  const [on, setOn] = useState(true)
  const [country, setCountry] = useState<string | null>(null)
  const [view, setView] = useState('grid')
  const [tags, setTags] = useState<string[]>(['silk', 'cotton'])
  const [fabric, setFabric] = useState<string | null>(null)
  const [chips, setChips] = useState<string[]>(['instock'])
  const [price, setPrice] = useState<[number, number]>([1500, 8000])
  const [sort, setSort] = useState<string[]>(['newest'])
  const [tab, setTab] = useState('details')
  const [singleImage, setSingleImage] = useState<File[]>([])
  const [multiImages, setMultiImages] = useState<File[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  const productColumns: Column<ProductRow>[] = [
    {
      header: 'Order ID',
      cell: (r) => <CopyCell value={`SHR-${1000 + r.id}`} />,
    },
    {
      header: 'Product',
      sortValue: (r) => r.name,
      cell: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { header: 'Category', sortValue: (r) => r.category, cell: (r) => r.category },
    {
      header: 'Price',
      align: 'right',
      sortValue: (r) => r.price,
      cell: (r) => `₹${r.price.toLocaleString('en-IN')}`,
    },
    {
      header: 'Status',
      cell: (r) =>
        r.status === 'active' ? (
          <Badge variant="success">In Stock</Badge>
        ) : r.status === 'low' ? (
          <Badge variant="warning">Low Stock</Badge>
        ) : (
          <Badge variant="danger">Out of Stock</Badge>
        ),
    },
    {
      header: '',
      align: 'right',
      cell: () => (
        <Button size="sm" variant="outline">
          Edit
        </Button>
      ),
    },
  ]
  const [calDate, setCalDate] = useState<Date | null>(new Date())
  const [pickDate, setPickDate] = useState<Date | null>(null)
  const [range, setRange] = useState<DateRange>({ start: null, end: null })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Component Library</h1>
      {/* Buttons */}
        <Section title="Buttons — variants">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </Section>

        <Section title="Buttons — sizes, icons, states">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add</Button>
          <Button variant="danger" rightIcon={<Trash2 className="h-4 w-4" />}>
            Delete
          </Button>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </Section>

        {/* Inputs */}
        <Section title="Inputs & Textarea">
          <div className="w-64">
            <Input label="Email" placeholder="admin@shreeni.com" />
          </div>
          <div className="w-64">
            <Input label="Password" type="password" placeholder="••••••••" />
          </div>
          <div className="w-64">
            <Input label="With error" defaultValue="bad" error="Invalid value" />
          </div>
          <div className="w-64">
            <Textarea label="Description" placeholder="Type here…" />
          </div>
        </Section>

        {/* Selection controls */}
        <Section title="Checkbox, Radio, Switch">
          <div className="flex flex-col gap-3">
            <Checkbox
              label="Remember me"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <Checkbox label="Disabled" disabled />
          </div>
          <RadioGroup
            value={radio}
            onChange={setRadio}
            options={[
              { label: 'Standard shipping', value: 'standard' },
              { label: 'Express shipping', value: 'express' },
              { label: 'Pickup (disabled)', value: 'pickup', disabled: true },
            ]}
          />
          <div className="flex flex-col gap-3">
            <Switch checked={on} onChange={setOn} label="Published" />
            <Switch checked={false} onChange={() => {}} label="Off" />
            <Switch checked disabled onChange={() => {}} label="Disabled" />
          </div>
        </Section>

        {/* Tooltip */}
        <Section title="Tooltip (hover)">
          <Tooltip content="Appears on top">
            <Button variant="outline">Top</Button>
          </Tooltip>
          <Tooltip content="Appears below" position="bottom">
            <Button variant="outline">Bottom</Button>
          </Tooltip>
          <Tooltip content="Appears left" position="left">
            <Button variant="outline">Left</Button>
          </Tooltip>
          <Tooltip content="Appears right" position="right">
            <Button variant="outline">Right</Button>
          </Tooltip>
        </Section>

        {/* Copy cell */}
        <Section title="Copy Cell (click to copy)">
          <CopyCell value="admin@shreeni.com" />
          <CopyCell value="SHR-1024" />
          <CopyCell value="https://shreeni.com/product/kanjivaram" label="Product link" />
        </Section>

        {/* Charts */}
        <Section title="Line Chart">
          <div className="w-full">
            <LineChart
              data={SALES_DATA}
              xKey="month"
              series={[
                { key: 'revenue', label: 'Revenue (₹)' },
                { key: 'orders', label: 'Orders' },
              ]}
            />
          </div>
        </Section>

        <Section title="Bar Chart">
          <div className="w-full">
            <BarChart
              data={CATEGORY_DATA}
              xKey="category"
              series={[
                { key: 'sold', label: 'Sold' },
                { key: 'returned', label: 'Returned' },
              ]}
            />
          </div>
        </Section>

        <Section title="Diverging Bar (positive / negative)">
          <div className="w-full">
            <DivergingBarChart
              data={PROFIT_DATA}
              xKey="month"
              valueKey="net"
            />
          </div>
        </Section>

        <Section title="Pie & Donut">
          <div className="min-w-[280px] flex-1">
            <PieChart data={SHARE_DATA} />
          </div>
          <div className="min-w-[280px] flex-1">
            <PieChart data={SHARE_DATA} donut />
          </div>
        </Section>

        {/* Table */}
        <Section title="Table">
          <div className="w-full">
            <Table
              columns={productColumns}
              data={PRODUCTS}
              rowKey={(r) => r.id}
              onRowClick={() => {}}
            />
          </div>
        </Section>

        {/* Image upload */}
        <Section title="Image Upload (single & multiple)">
          <div className="w-72">
            <ImageUpload
              label="Thumbnail (single)"
              value={singleImage}
              onChange={setSingleImage}
            />
          </div>
          <div className="w-80">
            <ImageUpload
              label="Gallery (multiple)"
              multiple
              value={multiImages}
              onChange={setMultiImages}
            />
          </div>
        </Section>

        {/* Box container (fieldset-style) */}
        <Section title="Box Container (titled border)">
          <BoxContainer title="Shipping Address" className="w-full max-w-md">
            <div className="space-y-3 pt-1">
              <Input label="Street" placeholder="123 Silk Road" />
              <div className="flex gap-3">
                <Input label="City" placeholder="Kolkata" />
                <Input label="PIN" placeholder="700001" />
              </div>
            </div>
          </BoxContainer>

          <BoxContainer title="Summary" className="w-64">
            <Text size="sm" variant="muted" className="pt-1">
              Any content goes here — the box title sits on the border at the
              top-left.
            </Text>
          </BoxContainer>
        </Section>

        {/* Tabs */}
        <Section title="Tabs">
          <div className="w-full">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { label: 'Details', value: 'details' },
                { label: 'Inventory', value: 'inventory' },
                { label: 'Shipping', value: 'shipping' },
              ]}
            />
            <div className="pt-4 text-sm text-gray-600">
              {tab === 'details' && <p>Product details panel content.</p>}
              {tab === 'inventory' && <p>Inventory &amp; stock panel content.</p>}
              {tab === 'shipping' && <p>Shipping options panel content.</p>}
            </div>
          </div>
        </Section>

        {/* Button group */}
        <Section title="Button Group (segmented)">
          <ButtonGroup
            value={view}
            onChange={setView}
            options={[
              { label: 'Grid', value: 'grid' },
              { label: 'List', value: 'list' },
              { label: 'Table', value: 'table' },
            ]}
          />
          <ButtonGroup
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { label: 'Day', value: 'grid' },
              { label: 'Week', value: 'list' },
              { label: 'Month', value: 'table' },
            ]}
          />
        </Section>

        {/* Range slider */}
        <Section title="Range Slider (price)">
          <div className="w-80">
            <RangeSlider
              label="Price range"
              min={0}
              max={15000}
              step={100}
              value={price}
              onChange={setPrice}
              format={(v) => `₹${v.toLocaleString('en-IN')}`}
            />
          </div>
        </Section>

        {/* Chip filters */}
        <Section title="Chip Filter (multi & single)">
          <div className="w-full space-y-4">
            <ChipFilter
              value={chips}
              onChange={setChips}
              options={[
                { label: 'In Stock', value: 'instock' },
                { label: 'On Sale', value: 'sale' },
                { label: 'New Arrival', value: 'new' },
                { label: 'Wedding', value: 'wedding' },
                { label: 'Under ₹2500', value: 'budget' },
              ]}
            />
            <ChipFilter
              single
              value={sort}
              onChange={setSort}
              options={[
                { label: 'Newest', value: 'newest' },
                { label: 'Price: Low to High', value: 'price-asc' },
                { label: 'Price: High to Low', value: 'price-desc' },
              ]}
            />
          </div>
        </Section>

        {/* All dropdowns */}
        <Section title="Dropdowns">
          <div className="w-72">
            <Dropdown
              label="Category (single)"
              value={country}
              onChange={setCountry}
              options={[
                { label: 'Silk Sarees', value: 'silk' },
                { label: 'Cotton Sarees', value: 'cotton' },
                { label: 'Designer Sarees', value: 'designer' },
                { label: 'Banarasi Sarees', value: 'banarasi' },
              ]}
            />
          </div>
          <div className="w-72">
            <MultiSelect
              label="Tags (multi-select)"
              value={tags}
              onChange={setTags}
              options={[
                { label: 'Silk', value: 'silk' },
                { label: 'Cotton', value: 'cotton' },
                { label: 'Designer', value: 'designer' },
                { label: 'Banarasi', value: 'banarasi' },
                { label: 'Wedding', value: 'wedding' },
              ]}
            />
          </div>
          <div className="w-72">
            <SearchableSelect
              label="Fabric (searchable)"
              value={fabric}
              onChange={setFabric}
              options={[
                { label: 'Kanjivaram', value: 'kanjivaram' },
                { label: 'Banarasi', value: 'banarasi' },
                { label: 'Chanderi', value: 'chanderi' },
                { label: 'Organza', value: 'organza' },
                { label: 'Tussar', value: 'tussar' },
                { label: 'Linen', value: 'linen' },
                { label: 'Mysore Silk', value: 'mysore' },
                { label: 'Jamdani', value: 'jamdani' },
              ]}
            />
          </div>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="success">In Stock</Badge>
          <Badge variant="warning">Low Stock</Badge>
          <Badge variant="danger">Out of Stock</Badge>
          <Badge variant="info">New</Badge>
        </Section>

        {/* Modal */}
        <Section title="Modal">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Delete product?"
            footer={
              <>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => setModalOpen(false)}>
                  Delete
                </Button>
              </>
            }
          >
            <p className="text-sm text-gray-600">
              This action cannot be undone. The product will be permanently
              removed from your catalogue.
            </p>
          </Modal>
        </Section>

        {/* Date components */}
        <Section title="Date Picker & Range Picker">
          <div className="w-64">
            <DatePicker
              label="Order date"
              value={pickDate}
              onChange={setPickDate}
            />
          </div>
          <div className="w-72">
            <DateRangePicker
              label="Report range"
              value={range}
              onChange={setRange}
            />
          </div>
        </Section>

      <Section title="Calendar (inline)">
        <Calendar selected={calDate} onSelect={setCalDate} />
      </Section>
    </div>
  )
}
