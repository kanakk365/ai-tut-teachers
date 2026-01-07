"use client"

import { useState, createContext, useContext, useEffect, useMemo, useCallback, useId, useLayoutEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  FlaskConical,
  FileQuestion,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

// Create Sidebar Context
const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
  primarySidebarId: string | null;
  registerSidebar: (id: string) => boolean;
  unregisterSidebar: (id: string) => void;
} | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [primarySidebarId, setPrimarySidebarId] = useState<string | null>(null)

  const registerSidebar = useCallback((id: string) => {
    let isPrimarySidebar = false

    setPrimarySidebarId((current) => {
      if (!current) {
        isPrimarySidebar = true
        return id
      }

      if (current === id) {
        isPrimarySidebar = true
        return current
      }

      return current
    })

    return isPrimarySidebar
  }, [])

  const unregisterSidebar = useCallback((id: string) => {
    setPrimarySidebarId((current) => (current === id ? null : current))
  }, [])

  const contextValue = useMemo(() => ({
    collapsed,
    setCollapsed,
    primarySidebarId,
    registerSidebar,
    unregisterSidebar,
  }), [collapsed, primarySidebarId, registerSidebar, unregisterSidebar])

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

const navigationItems = [
  { icon: GraduationCap, label: "Class", href: "/classes" },
  { icon: Users, label: "Students", href: "/students" },
  { icon: User, label: "Teachers", href: "/teachers" },
  { icon: FlaskConical, label: "Project Lab", href: "/projects" },
  { icon: FileQuestion, label: "Quizzes", href: "/quizzes" },
  { icon: FileText, label: "Exams", href: "/exams" },
  { icon: FileText, label: "Custom Exam", href: "/custom-exam" },
  { icon: FileQuestion, label: "Custom Quiz", href: "/custom-quiz" },
  { icon: User, label: "Profile", href: "/profile" },
]

const quizSubNavigation = [
  { name: "View Quiz", href: "/quizzes", icon: Eye },
  { name: "Create Quiz", href: "/quizzes/create/grade", icon: Plus },
]

const projectSubNavigation = [
  { name: "View Projects", href: "/projects", icon: Eye },
  { name: "Create Project", href: "/projects/create", icon: Plus },
]

const examSubNavigation = [
  { name: "View Exams", href: "/exams", icon: Eye },
  { name: "Create Exam", href: "/exams/create/grade", icon: Plus },
]

const customExamSubNavigation = [
  { name: "View Custom Exams", href: "/custom-exam", icon: Eye },
  { name: "Create Custom Exam", href: "/custom-exam/grade", icon: Plus },
]

const customQuizSubNavigation = [
  { name: "View Custom Quizzes", href: "/custom-quiz", icon: Eye },
  { name: "Create Custom Quiz", href: "/custom-quiz/grade", icon: Plus },
]
const bottomItems = [
  { icon: LogOut, label: "Logout", href: "/logout" },
]

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  setCollapsed?: Dispatch<SetStateAction<boolean>>;
}

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

export function Sidebar({ className, collapsed: externalCollapsed, setCollapsed: externalSetCollapsed }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { institution, logout } = useAuth()
  const {
    collapsed: contextCollapsed,
    setCollapsed: contextSetCollapsed,
    primarySidebarId,
    registerSidebar,
    unregisterSidebar,
  } = useSidebar()
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(contextCollapsed)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isQuizzesExpanded, setIsQuizzesExpanded] = useState(false)
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false)
  const [isExamsExpanded, setIsExamsExpanded] = useState(false)
  const [isCustomExamsExpanded, setIsCustomExamsExpanded] = useState(false)
  const [isCustomQuizzesExpanded, setIsCustomQuizzesExpanded] = useState(false)
  const [isPrimarySidebar, setIsPrimarySidebar] = useState(true)
  const sidebarId = useId()

  // Use external collapsed state if provided, otherwise use internal state
  const isCollapsed = externalCollapsed ?? contextCollapsed ?? internalIsCollapsed
  const setIsCollapsed = externalSetCollapsed ?? contextSetCollapsed ?? setInternalIsCollapsed
  const navIconClassName = isCollapsed ? "h-5 w-5" : "h-5 w-5"

  useIsomorphicLayoutEffect(() => {
    const registeredAsPrimary = registerSidebar(sidebarId)
    setIsPrimarySidebar(registeredAsPrimary)

    return () => {
      unregisterSidebar(sidebarId)
    }
  }, [registerSidebar, unregisterSidebar, sidebarId])

  useEffect(() => {
    if (primarySidebarId === null) {
      const registeredAsPrimary = registerSidebar(sidebarId)
      setIsPrimarySidebar(registeredAsPrimary)
      return
    }

    setIsPrimarySidebar(primarySidebarId === sidebarId)
  }, [primarySidebarId, registerSidebar, sidebarId])

  // Auto-expand sections when on respective pages
  useEffect(() => {
    if (pathname.startsWith('/quizzes')) {
      setIsQuizzesExpanded(true)
    }
    if (pathname.startsWith('/projects')) {
      setIsProjectsExpanded(true)
    }
    if (pathname.startsWith('/exams')) {
      setIsExamsExpanded(true)
    }
    if (pathname.startsWith('/custom-exam')) {
      setIsCustomExamsExpanded(true)
    }
    if (pathname.startsWith('/custom-quiz')) {
      setIsCustomQuizzesExpanded(true)
    }
  }, [pathname])

  const handleNavigation = (href: string) => {
    if (href === '/logout') {
      console.log('=== LOGOUT BUTTON CLICKED ===');
      console.log('About to call logout function...');

      try {
        logout();
        console.log('Logout function completed successfully');

        console.log('Navigating to login page...');
        router.push('/login');

        // Force a page reload to ensure all state is cleared
        setTimeout(() => {
          console.log('Force redirecting to login page...');
          window.location.href = '/login';
        }, 500);
      } catch (error) {
        console.error('Error during logout:', error);
      }

      return;
    }
    router.push(href)
    setIsMobileOpen(false) // Close mobile menu after navigation
  }

  if (!isPrimarySidebar) {
    return null
  }

  return (
    <>
      {/* Mobile Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-label="Close sidebar overlay"
          tabIndex={0}
          onClick={() => setIsMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setIsMobileOpen(false)
            }
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className,
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
          <div
            className={cn(
              "flex flex-col items-center w-full min-w-0",
              isCollapsed ? "justify-center" : "gap-3"
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-md bg-gray-100 flex flex-col items-center justify-center",
                isCollapsed ? "h-10 w-10" : "h-12 w-12"
              )}
            >
              {institution?.logoUrl ? (
                <Image
                  src={institution.logoUrl}
                  alt={`${institution?.name ?? "Institution"} logo`}
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              ) : (
                <span className="text-xs font-semibold text-gray-600">
                  {institution?.name?.charAt(0)?.toUpperCase() || "I"}
                </span>
              )}
            </div>

            {!isCollapsed && (
              <div className=" px-3 flex flex-1 flex-col overflow-hidden min-w-0">
                <p
                  className="text-sm font-semibold text-gray-900 break-words leading-tight"
                  title={institution?.name || undefined}
                >
                  {institution?.name || "Institution"}
                </p>
                {institution?.affiliatedBoard && (
                  <p className="text-xs text-gray-600 truncate">
                    {institution.affiliatedBoard}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Collapse/Expand Button - Desktop only */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8"
            onClick={() => setIsCollapsed((prev) => !prev)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.label === "Students" && pathname.startsWith("/students")) ||
              (item.label === "Teachers" && pathname.startsWith("/teachers")) ||
              (item.label === "Quizzes" && pathname.startsWith("/quizzes")) ||
              (item.label === "Project Lab" && pathname.startsWith("/projects")) ||
              (item.label === "Exams" && pathname.startsWith("/exams")) ||
              (item.label === "Custom Exam" && pathname.startsWith("/custom-exam")) ||
              (item.label === "Custom Quiz" && pathname.startsWith("/custom-quiz")) ||
              (item.label === "Profile" && pathname.startsWith("/profile"))

            // Function to close all sub-menus
            const closeAllSubMenus = () => {
              setIsQuizzesExpanded(false);
              setIsProjectsExpanded(false);
              setIsExamsExpanded(false);
              setIsCustomExamsExpanded(false);
              setIsCustomQuizzesExpanded(false);
            }

            return (
              <div key={item.label}>
                {item.label === "Quizzes" ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                      isActive
                        ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[color:var(--primary-foreground)]"
                        : "text-gray-700 hover:bg-gray-100",
                      isCollapsed && "justify-center gap-0 px-0",
                    )}
                    onClick={() => {
                      closeAllSubMenus();
                      setIsQuizzesExpanded(true);
                      setIsMobileOpen(false);
                    }}
                  >
                    <item.icon className={navIconClassName} />
                    {!isCollapsed && item.label}
                  </Link>
                ) : item.label === "Project Lab" ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                      isActive
                        ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[color:var(--primary-foreground)]"
                        : "text-gray-700 hover:bg-gray-100",
                      isCollapsed && "justify-center gap-0 px-0",
                    )}
                    onClick={() => {
                      closeAllSubMenus();
                      setIsProjectsExpanded(true);
                      setIsMobileOpen(false);
                    }}
                  >
                    <item.icon className={navIconClassName} />
                    {!isCollapsed && item.label}
                  </Link>
                ) : item.label === "Exams" ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                      isActive
                        ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[color:var(--primary-foreground)]"
                        : "text-gray-700 hover:bg-gray-100",
                      isCollapsed && "justify-center gap-0 px-0",
                    )}
                    onClick={() => {
                      closeAllSubMenus();
                      setIsExamsExpanded(true);
                      setIsMobileOpen(false);
                    }}
                  >
                    <item.icon className={navIconClassName} />
                    {!isCollapsed && item.label}
                  </Link>
                ) : item.label === "Custom Exam" ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                      isActive
                        ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[color:var(--primary-foreground)]"
                        : "text-gray-700 hover:bg-gray-100",
                      isCollapsed && "justify-center gap-0 px-0",
                    )}
                    onClick={() => {
                      closeAllSubMenus();
                      setIsCustomExamsExpanded(true);
                      setIsMobileOpen(false);
                    }}
                  >
                    <item.icon className={navIconClassName} />
                    {!isCollapsed && item.label}
                  </Link>
                ) : item.label === "Custom Quiz" ? (
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                      isActive
                        ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[color:var(--primary-foreground)]"
                        : "text-gray-700 hover:bg-gray-100",
                      isCollapsed && "justify-center gap-0 px-0",
                    )}
                    onClick={() => {
                      closeAllSubMenus();
                      setIsCustomQuizzesExpanded(true);
                      setIsMobileOpen(false);
                    }}
                  >
                    <item.icon className={navIconClassName} />
                    {!isCollapsed && item.label}
                  </Link>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-[color:var(--primary-foreground)]"
                        : "text-gray-700 hover:bg-gray-100",
                      isCollapsed && "justify-center gap-0 px-0",
                    )}
                    onClick={() => {
                      // Close all sub-menus when clicking on non-expandable items
                      closeAllSubMenus();
                      setIsMobileOpen(false);
                    }}
                  >
                    <item.icon className={navIconClassName} />
                    {!isCollapsed && item.label}
                  </Link>
                )}

                {/* Quiz Sub-navigation */}
                {item.label === "Quizzes" && isQuizzesExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {quizSubNavigation.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          (() => {
                            // Special logic for quiz sub-navigation
                            if (item.label === "Quizzes") {
                              if (subItem.name === "View Quiz") {
                                // View Quiz: gray when not exactly on /quizzes
                                return pathname !== "/quizzes" && "text-gray-600 hover:bg-gray-50";
                              } else if (subItem.name === "Create Quiz") {
                                // Create Quiz: gray when not on quiz-related paths (except main /quizzes)
                                return !(pathname !== "/quizzes" && pathname.startsWith("/quizzes")) && "text-gray-600 hover:bg-gray-50";
                              }
                            }
                            // Default logic for other sub-navigations
                            return pathname !== subItem.href && !pathname.startsWith(subItem.href) && "text-gray-600 hover:bg-gray-50";
                          })(),
                        )}
                        style={
                          (() => {
                            // Special logic for quiz sub-navigation
                            if (item.label === "Quizzes") {
                              if (subItem.name === "View Quiz") {
                                // View Quiz: highlighted only when exactly on /quizzes (main quiz list)
                                return pathname === "/quizzes"
                                  ? {
                                    backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                                    color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                                  }
                                  : undefined;
                              } else if (subItem.name === "Create Quiz") {
                                // Create Quiz: highlighted when on any quiz-related path except the main /quizzes page
                                return pathname !== "/quizzes" && pathname.startsWith("/quizzes")
                                  ? {
                                    backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                                    color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                                  }
                                  : undefined;
                              }
                            }
                            // Default logic for other sub-navigations
                            return pathname === subItem.href || pathname.startsWith(subItem.href)
                              ? {
                                backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                                color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                              }
                              : undefined;
                          })()
                        }
                      >
                        <subItem.icon className="w-4 h-4" />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Project Sub-navigation */}
                {item.label === "Project Lab" && isProjectsExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {projectSubNavigation.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          pathname !== subItem.href && "text-gray-600 hover:bg-gray-50",
                        )}
                        style={
                          pathname === subItem.href
                            ? {
                              backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                              color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                            }
                            : undefined
                        }
                      >
                        <subItem.icon className="w-4 h-4" />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Exam Sub-navigation */}
                {item.label === "Exams" && isExamsExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {examSubNavigation.map((subItem) => {
                      const isCreateExamActive = subItem.name === "Create Exam" &&
                        (pathname === subItem.href ||
                          pathname === "/exams/create/section" ||
                          pathname === "/exams/create/students" ||
                          pathname === "/exams/create/assign");

                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isCreateExamActive
                              ? "bg-[linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)] text-[color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)]"
                              : pathname !== subItem.href && "text-gray-600 hover:bg-gray-50",
                          )}
                          style={
                            isCreateExamActive
                              ? {
                                backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                                color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                              }
                              : pathname === subItem.href
                                ? {
                                  backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                                  color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                                }
                                : undefined
                          }
                        >
                          <subItem.icon className="w-4 h-4" />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Custom Exam Sub-navigation */}
                {item.label === "Custom Exam" && isCustomExamsExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {customExamSubNavigation.map((subItem) => {
                      const isCreateCustomExamActive = subItem.name === "Create Custom Exam" &&
                        (pathname === subItem.href ||
                          pathname === "/custom-exam/section" ||
                          pathname === "/custom-exam/students" ||
                          pathname === "/custom-exam/form" ||
                          pathname === "/custom-exam/assign");

                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isCreateCustomExamActive
                              ? "bg-[linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)] text-[color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)]"
                              : pathname !== subItem.href && "text-gray-600 hover:bg-gray-50",
                          )}
                          style={
                            isCreateCustomExamActive
                              ? {
                                backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                                color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                              }
                              : pathname === subItem.href
                                ? {
                                  backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                                  color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                                }
                                : undefined
                          }
                        >
                          <subItem.icon className="w-4 h-4" />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Custom Quiz Sub-navigation */}
                {item.label === "Custom Quiz" && isCustomQuizzesExpanded && !isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {customQuizSubNavigation.map((subItem) => {
                      const isCreateCustomQuizActive = subItem.name === "Create Custom Quiz" &&
                        (pathname === subItem.href ||
                          pathname === "/custom-quiz/section" ||
                          pathname === "/custom-quiz/students" ||
                          pathname === "/custom-quiz/form" ||
                          pathname === "/custom-quiz/assign");

                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isCreateCustomQuizActive
                              ? "bg-[linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)] text-[color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)]"
                              : pathname !== subItem.href && "text-gray-600 hover:bg-gray-50",
                          )}
                          style={
                            isCreateCustomQuizActive
                              ? {
                                backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                                color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                              }
                              : pathname === subItem.href
                                ? {
                                  backgroundColor: "linear-gradient(135deg, color-mix(in oklch, var(--primary) 15%, white 85%) 0%, color-mix(in oklch, var(--secondary) 15%, white 85%) 100%)",
                                  color: "color-mix(in oklch, var(--primary-foreground) 80%, var(--muted-foreground) 20%)",
                                }
                                : undefined
                          }
                        >
                          <subItem.icon className="w-4 h-4" />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {bottomItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "w-full justify-start h-10 hover:text-white text-gray-700 cursor-pointer",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn(isCollapsed ? "h-8 w-8" : "h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          ))}

          {/* User Profile */}
          {!isCollapsed && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mt-4 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleNavigation('/profile')}
            >
              <Avatar className="h-10 w-10">
                {institution?.profilePhotoUrl ? (
                  <AvatarImage src={institution.profilePhotoUrl} alt={institution.name} />
                ) : null}
                <AvatarFallback
                  className="font-semibold"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  {institution?.name?.charAt(0)?.toUpperCase() || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600">Welcome 👋</p>
                <p className="text-sm font-medium text-gray-900 truncate">{institution?.name || 'School'}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
