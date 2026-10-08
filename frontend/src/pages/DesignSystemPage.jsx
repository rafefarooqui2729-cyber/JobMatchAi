import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import { designTokens } from '../design-system/tokens.js';

import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmationDialog,
  Dropdown,
  DropdownItem,
  EmptyState,
  ErrorState,
  Input,
  LoadingSkeleton,
  MatchScore,
  Modal,
  Navbar,
  PageHeader,
  Pagination,
  ProgressBar,
  SearchBox,
  Select,
  Sidebar,
  SkillChip,
  StatCard,
  Table,
  Tabs,
  useToast,
} from '../components/ui/index.js';

const sidebarItems = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/design-system', label: 'Design system', icon: '◈' },
];

const sampleTabs = [
  {
    value: 'overview',
    label: 'Overview',
    content: (
      <p className="text-sm leading-6 text-slate-300">
        Tab panels can contain any accessible page content.
      </p>
    ),
  },
  {
    value: 'details',
    label: 'Details',
    content: (
      <p className="text-sm leading-6 text-slate-300">
        Keyboard: use the left and right arrow keys to switch tabs.
      </p>
    ),
  },
  {
    value: 'activity',
    label: 'Activity',
    content: (
      <p className="text-sm leading-6 text-slate-300">
        No activity has been loaded.
      </p>
    ),
  },
];

function Section({ id, title, description, children }) {
  return (
    <section
      id={id}
      className="
        relative
        scroll-mt-24
        border-b border-white/[0.08]
        py-10
        first:pt-0
        last:border-none
      "
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
            Component
          </span>
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

function TokenSwatches() {
  const colors = [
    ['Navy 950', designTokens.color.navy[950]],
    ['Navy 900', designTokens.color.navy[900]],
    ['Navy 800', designTokens.color.navy[800]],
    ['Navy 100', designTokens.color.navy[100]],
    ['Canvas', designTokens.color.canvas],
    ['Accent', designTokens.color.accent],
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {colors.map(([name, hex]) => (
        <div
          key={name}
          className="
            group
            overflow-hidden
            rounded-2xl
            border border-white/[0.08]
            bg-white/[0.045]
            shadow-[0_12px_40px_rgba(0,0,0,0.18)]
            backdrop-blur-xl
            transition-all duration-300
            hover:-translate-y-1
            hover:border-cyan-400/20
            hover:bg-white/[0.07]
          "
        >
          <div
            className="
              h-20
              border-b border-white/[0.08]
              shadow-inner
            "
            style={{ background: hex }}
          />

          <div className="p-3.5">
            <p className="text-xs font-semibold text-white">
              {name}
            </p>

            <p className="mt-1 font-mono text-[10px] text-slate-500">
              {hex}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DesignSystemPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const toast = useToast();

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          inset-0
          -z-10
          overflow-hidden
        "
      >
        <div
          className="
            absolute
            -left-40
            -top-40
            h-[32rem]
            w-[32rem]
            rounded-full
            bg-cyan-500/[0.08]
            blur-[120px]
          "
        />

        <div
          className="
            absolute
            -right-40
            top-[25%]
            h-[30rem]
            w-[30rem]
            rounded-full
            bg-blue-600/[0.08]
            blur-[120px]
          "
        />

        <div
          className="
            absolute
            bottom-[-15rem]
            left-[35%]
            h-[28rem]
            w-[28rem]
            rounded-full
            bg-indigo-600/[0.06]
            blur-[120px]
          "
        />
      </div>

      <Navbar
        onMenuClick={() => setSidebarOpen(true)}
        actions={
          <>
            <Link
              to="/"
              className="
                hidden
                rounded-xl
                border border-white/[0.08]
                bg-white/[0.035]
                px-3.5
                py-2.5
                text-sm
                font-medium
                text-slate-300
                backdrop-blur-xl
                transition
                hover:border-cyan-400/20
                hover:bg-white/[0.07]
                hover:text-white
                sm:block
              "
            >
              Home
            </Link>

            <Link
              to="/login"
              className="
                rounded-xl
                border border-cyan-300/20
                bg-gradient-to-r
                from-cyan-500
                to-blue-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-[0_8px_30px_rgba(6,182,212,0.18)]
                transition
                hover:-translate-y-0.5
                hover:shadow-[0_12px_35px_rgba(6,182,212,0.25)]
              "
            >
              Sign in
            </Link>
          </>
        }
      />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[90rem]">
        <Sidebar
          items={sidebarItems}
          title="Reference"
          open={sidebarOpen}
          onClose={closeSidebar}
        />

        <main className="min-w-0 flex-1 px-4 py-7 sm:px-8 sm:py-10 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <PageHeader
              eyebrow="Foundation"
              title="Design system"
              description="Reusable interface components, interaction patterns, and visual tokens. This reference uses empty or neutral component states and contains no dashboard records."
              actions={
                <Badge tone="info" dot>
                  Reusable UI
                </Badge>
              }
            />

            <div className="space-y-0 py-8">
              {/* TOKENS */}
              <Section
                id="tokens"
                title="Design tokens"
                description="A centralized set of color, spacing, radius, shadow, and motion primitives."
              >
                <TokenSwatches />

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <Card className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Spacing
                    </p>

                    <p className="mt-2 text-sm text-slate-200">
                      4 · 8 · 12 · 16 · 20 · 24 px
                    </p>
                  </Card>

                  <Card className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Radius
                    </p>

                    <p className="mt-2 text-sm text-slate-200">
                      12 px controls · 16 px cards
                    </p>
                  </Card>

                  <Card className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Motion
                    </p>

                    <p className="mt-2 text-sm text-slate-200">
                      160–400 ms · reduced-motion aware
                    </p>
                  </Card>
                </div>
              </Section>

              {/* NAVIGATION */}
              <Section
                id="navigation"
                title="Navigation"
                description="Responsive application navbar and a mobile drawer / desktop sidebar."
              >
                <Card className="overflow-hidden">
                  <div className="border-b border-white/[0.08]">
                    <Navbar
                      className="static border-0"
                      actions={
                        <Button size="sm" variant="secondary">
                          Account
                        </Button>
                      }
                    />
                  </div>

                  <div className="flex min-h-44">
                    <div className="hidden border-r border-white/[0.08] md:block">
                      <Sidebar items={sidebarItems} title="Workspace" />
                    </div>

                    <div
                      className="
                        flex
                        flex-1
                        items-center
                        justify-center
                        p-6
                        text-center
                        text-sm
                        leading-6
                        text-slate-400
                      "
                    >
                      On narrow screens, use the menu button in the top bar to
                      open the animated navigation drawer.
                    </div>
                  </div>
                </Card>
              </Section>

              {/* ACTIONS */}
              <Section
                id="actions"
                title="Actions and form controls"
                description="Consistent focus treatment, validation messages, and button feedback."
              >
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="space-y-5 p-6">
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Buttons
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Button>Primary action</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="subtle">Subtle</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="danger">Destructive</Button>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Sizes and states
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm">Small</Button>
                        <Button size="md">Standard</Button>
                        <Button size="lg">Large</Button>
                        <Button loading>Loading</Button>
                      </div>
                    </div>
                  </Card>

                  <Card className="grid gap-4 p-6 sm:grid-cols-2">
                    <Input
                      label="Text input"
                      placeholder="Enter a value"
                      hint="Supporting help text."
                    />

                    <Select
                      label="Select"
                      placeholder="Choose an option"
                      options={[]}
                    />

                    <Input
                      label="Invalid input"
                      error="This field needs attention."
                      defaultValue=""
                    />

                    <SearchBox
                      label="Search"
                      placeholder="Search items"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      onSubmit={() =>
                        toast('Search control submitted.', {
                          tone: 'info',
                        })
                      }
                    />
                  </Card>
                </div>
              </Section>

              {/* FEEDBACK */}
              <Section
                id="feedback"
                title="Feedback and status"
                description="Semantic status colors are restrained and always accompanied by readable labels."
              >
                <Card className="flex flex-wrap items-center gap-2 p-6">
                  <Badge>Neutral</Badge>

                  <Badge tone="navy">
                    Navy
                  </Badge>

                  <Badge tone="success" dot>
                    Complete
                  </Badge>

                  <Badge tone="warning" dot>
                    Needs review
                  </Badge>

                  <Badge tone="danger" dot>
                    Attention
                  </Badge>

                  <Badge tone="info">
                    Informational
                  </Badge>

                  <span className="mx-2 hidden h-8 w-px bg-white/[0.1] sm:block" />

                  <Avatar name="JobMatch AI" size="sm" />
                  <Avatar name="JobMatch AI" size="md" />
                  <Avatar name="JobMatch AI" size="lg" />

                  <SkillChip>
                    Canonical skill
                  </SkillChip>

                  <SkillChip missing>
                    Missing skill
                  </SkillChip>

                  <Dropdown label="Actions">
                    <DropdownItem
                      onClick={() =>
                        toast('Dropdown action selected.', {
                          tone: 'info',
                        })
                      }
                    >
                      First action
                    </DropdownItem>

                    <DropdownItem
                      onClick={() =>
                        toast('Destructive action selected.', {
                          tone: 'warning',
                        })
                      }
                      destructive
                    >
                      Destructive action
                    </DropdownItem>
                  </Dropdown>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      toast('This is a dismissible notification.', {
                        tone: 'success',
                      })
                    }
                  >
                    Show toast
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setModalOpen(true)}
                  >
                    Open modal
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmationOpen(true)}
                  >
                    Confirm action
                  </Button>
                </Card>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ProgressBar
                    value={0}
                    label="Progress (no data)"
                    showValue
                  />

                  <ProgressBar
                    value={0}
                    label="Alternate progress"
                    showValue
                    tone="blue"
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-5">
                  <MatchScore score={0} size="sm" />
                  <MatchScore score={0} size="md" />
                  <MatchScore score={0} size="lg" />

                  <span className="text-sm text-slate-400">
                    Match indicator with neutral, empty score.
                  </span>
                </div>
              </Section>

              {/* DATA DISPLAY */}
              <Section
                id="data-display"
                title="Data display"
                description="Cards, headings, tables, tabs, and pagination do not assume or fabricate loaded records."
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Metric"
                    value="—"
                    detail="Waiting for data"
                  />

                  <StatCard
                    label="Metric"
                    value="—"
                    detail="Waiting for data"
                    icon="◈"
                  />

                  <StatCard
                    label="Metric"
                    value="—"
                    detail="Waiting for data"
                  />

                  <StatCard
                    label="Metric"
                    value="—"
                    detail="Waiting for data"
                  />
                </div>

                <Card className="mt-5 p-6">
                  <Tabs tabs={sampleTabs} />
                </Card>

                <Table
                  className="mt-5"
                  caption="Empty table component"
                  columns={[
                    {
                      key: 'item',
                      header: 'Item',
                    },
                    {
                      key: 'status',
                      header: 'Status',
                    },
                    {
                      key: 'updated',
                      header: 'Updated',
                    },
                  ]}
                  rows={[]}
                />

                <Pagination
                  page={page}
                  pageCount={1}
                  onPageChange={setPage}
                  className="mt-5"
                />

                <div className="mt-5">
                  <EmptyState
                    title="Nothing to display"
                    description="This is the reusable empty state for a collection with no results."
                    icon="—"
                  />
                </div>
              </Section>

              {/* LOADING / ERRORS */}
              <Section
                id="loading-errors"
                title="Loading and error states"
              >
                <Card className="grid gap-6 p-6 sm:grid-cols-2">
                  <div
                    className="space-y-3"
                    aria-label="Loading preview"
                  >
                    <LoadingSkeleton className="h-4 w-1/3" />
                    <LoadingSkeleton className="h-8 w-2/3" />
                    <LoadingSkeleton
                      className="h-16 w-full"
                      rounded="rounded-xl"
                    />
                  </div>

                  <ErrorState
                    title="Unable to load"
                    description="The component can explain a failure and offer an explicit retry action."
                    onRetry={() =>
                      toast('Retry action requested.', {
                        tone: 'info',
                      })
                    }
                  />
                </Card>
              </Section>

              {/* JOB CARD */}
              <Section
                id="job-card"
                title="Job card"
                description="The job card only renders when supplied with real job data; this reference deliberately does not invent a role or match score."
              >
                <EmptyState
                  title="Job card ready for real data"
                  description="Pass a job object and optional match evidence to the reusable JobCard component."
                />
              </Section>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reusable modal"
        description="Responsive dialog with Escape handling, focus management, and a mobile sheet layout."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                setModalOpen(false);

                toast('Dialog action completed.', {
                  tone: 'success',
                });
              }}
            >
              Done
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-300">
          Dialog content belongs here. Keyboard focus is moved into the
          dialog and restored when it closes.
        </p>
      </Modal>

      {/* CONFIRMATION */}
      <ConfirmationDialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={() => {
          setConfirmationOpen(false);

          toast('Confirmation accepted.', {
            tone: 'success',
          });
        }}
        title="Confirm action"
        description="This reusable pattern makes the consequence clear before continuing."
        confirmLabel="Continue"
      />
    </div>
  );
}