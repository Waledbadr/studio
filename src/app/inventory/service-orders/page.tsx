"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useServiceOrders } from "@/context/service-orders-context";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useResidences } from "@/context/residences-context";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { useUsers } from "@/context/users-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export default function ServiceOrdersListPage() {
  const { serviceOrders, loading } = useServiceOrders();
  const { residences } = useResidences();
  const { currentUser } = useUsers();
  const { dict } = useLanguage();
  const router = useRouter();

  const [status, setStatus] = useState<string>("ALL");
  const [residenceId, setResidenceId] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Limit visible residences to those assigned to the current user (fallback to all)
  const userResidenceIds = (currentUser?.assignedResidences || []).filter(Boolean);
  const allowedResidences = useMemo(() => {
    if (userResidenceIds.length > 0) return residences.filter((r) => userResidenceIds.includes(r.id));
    return residences;
  }, [residences, userResidenceIds]);

  // Base filtering by user-allowed residences, residence select, and search
  const baseFiltered = useMemo(() => {
    const initial = (serviceOrders || []);
    const byUserResidences = userResidenceIds.length > 0
      ? initial.filter((o) => userResidenceIds.includes(o.residenceId))
      : initial;
    const byResidence = residenceId === "ALL" ? byUserResidences : byUserResidences.filter((o) => o.residenceId === residenceId);
    const q = search.trim().toLowerCase();
    if (!q) return byResidence;
    return byResidence.filter((o) => {
      const hay = `${o.codeShort || ''} ${o.residenceName || ''} ${o.destination?.name || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [serviceOrders, userResidenceIds, residenceId, search]);

  // Split into active (non-completed) and completed, honoring status filter if set
  const activeOrders = useMemo(() => {
    const list = baseFiltered.filter((o) => o.status !== "COMPLETED");
    return status === "ALL" ? list : list.filter((o) => o.status === status);
  }, [baseFiltered, status]);

  const completedOrders = useMemo(() => {
    const list = baseFiltered.filter((o) => o.status === "COMPLETED");
    return status === "ALL" ? list : list.filter((o) => o.status === status);
  }, [baseFiltered, status]);

  const [completedOpen, setCompletedOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Orders</h1>
          <p className="text-muted-foreground">Send items to maintenance/workshops and track returns.</p>
        </div>
        <Button asChild>
          <Link href="/inventory/service-orders/new">
            <PlusCircle className="mr-2 h-4 w-4" /> New Service Order
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-44"><SelectValue placeholder={dict.selectStatus} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                  <SelectItem value="PARTIAL_RETURN">Partial Return</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
    <div>
              <div className="text-xs text-muted-foreground mb-1">Residence</div>
              <Select value={residenceId} onValueChange={setResidenceId}>
                <SelectTrigger className="w-56"><SelectValue placeholder={dict.selectResidence} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All residences</SelectItem>
      {allowedResidences.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="text-xs text-muted-foreground mb-1">Search</div>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={dict.searchByReference} />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Residence</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : activeOrders.length === 0 ? (
                <TableRow><TableCell colSpan={6}>No service orders</TableCell></TableRow>
              ) : (
                activeOrders.map((o) => (
                  <TableRow
                    key={o.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/inventory/service-orders/${o.codeShort}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/inventory/service-orders/${o.codeShort}`); }}
                  >
                    <TableCell>
                      {o.dateCreated ? format(o.dateCreated.toDate(), "PPP") : "—"}
                    </TableCell>
                    <TableCell>{o.residenceName}</TableCell>
                    <TableCell>{o.destination?.name}</TableCell>
                    <TableCell>{o.items?.reduce((s, it) => s + (it.qtySent || 0), 0)}</TableCell>
                    <TableCell className="font-mono">
                      <Link href={`/inventory/service-orders/${o.codeShort}`}>{o.codeShort}</Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.status === "COMPLETED" ? "default" : o.status === "DISPATCHED" ? "secondary" : "outline"}>{o.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Completed orders (collapsible) */}
      <Card>
        <CardContent className="pt-4">
          <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Completed Orders</h2>
                <p className="text-xs text-muted-foreground">Closed/fully returned service orders</p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <span>{completedOrders.length}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${completedOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Residence</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={`skc-${i}`}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : completedOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={6}>No completed orders</TableCell></TableRow>
                    ) : (
                      completedOrders.map((o) => (
                        <TableRow
                          key={o.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => router.push(`/inventory/service-orders/${o.codeShort}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/inventory/service-orders/${o.codeShort}`); }}
                        >
                          <TableCell>
                            {o.dateCreated ? format(o.dateCreated.toDate(), "PPP") : "—"}
                          </TableCell>
                          <TableCell>{o.residenceName}</TableCell>
                          <TableCell>{o.destination?.name}</TableCell>
                          <TableCell>{o.items?.reduce((s, it) => s + (it.qtySent || 0), 0)}</TableCell>
                          <TableCell className="font-mono">
                            <Link href={`/inventory/service-orders/${o.codeShort}`}>{o.codeShort}</Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">{o.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
