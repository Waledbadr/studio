const fs = require('fs');
let c = fs.readFileSync('src/app/accommodation/invoices/[id]/page.tsx','utf8');
const searchReg = /const workerDetails = useMemo\(\(\): WorkerInvoiceDetail\[\] => \{[\s\S]*?\}, \[invoice, company, workers, occupants, accommodationHistory, residences, contract, getHistoryByDateRange\]\);/g;

const replacement = const [workerDetails, setWorkerDetails] = useState<WorkerInvoiceDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (!invoice || !company) return;
      setIsLoadingDetails(true);
      try {
        const startDate = new Date(invoice.startDate);
        const endDate = new Date(invoice.endDate);

        // Get all history for the period
        const periodHistory = await fetchHistoryByDateRange(invoice.startDate, invoice.endDate);

        // Find workers for this company
        const companyWorkers = workers.filter(w =>
          w.company === company.name || w.company === company.id
        );

        const details: WorkerInvoiceDetail[] = [];

        for (const worker of companyWorkers) {
          // Get worker movements in this residence during the period
          const workerMovements = periodHistory.filter(h =>
            h.workerId === worker.id &&
            h.residenceId === invoice.residenceId
          ).sort((a, b) => new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime());

          // Check current occupancy (no checkout date)
          const currentOccupancy = occupants.find(o =>
            o.workerId === worker.id && o.residenceId === invoice.residenceId && !o.until
          );

          // Check all occupancy records (including checked out) that overlap with billing period
          const allWorkerOccupancy = occupants.filter(o => {
            if (o.workerId !== worker.id || o.residenceId !== invoice.residenceId) return false;
            const occStart = new Date(o.since);
            const occEnd = o.until ? new Date(o.until) : endDate;
            // Check if occupancy overlaps with billing period
            return occStart <= endDate && occEnd >= startDate;
          });

          // Determine initial state and room info
          let isInside = false;
          let roomName = '';
          let buildingName = '';
          let floorName = '';
          let originalCheckIn = '';
          let originalCheckOut: string | null = null;

          if (workerMovements.length > 0) {
            const firstEvent = workerMovements[0];
            const isTransferOut = firstEvent.actionType === 'TRANSFER' && firstEvent.fromResidenceId === invoice.residenceId;
            if (firstEvent.actionType === 'CHECK_OUT' || isTransferOut) {
              isInside = true;
              roomName = firstEvent.roomName || firstEvent.fromRoomName || '';
              buildingName = firstEvent.buildingName || '';
              floorName = firstEvent.floorName || '';
            }
          } else if (currentOccupancy) {
            if (new Date(currentOccupancy.since) < startDate) {
              isInside = true;
            }
          } else if (allWorkerOccupancy.length > 0) {
            // Check if worker was inside at period start based on any occupancy record
            for (const occ of allWorkerOccupancy) {
              const occStart = new Date(occ.since);
              const occEnd = occ.until ? new Date(occ.until) : endDate;
              if (occStart < startDate && occEnd > startDate) {
                isInside = true;
                break;
              }
            }
          }

          // Find room info from movements or occupancy
          const checkInEvent = workerMovements.find(h =>
            h.actionType === 'CHECK_IN' ||
            (h.actionType === 'TRANSFER' && h.toResidenceId === invoice.residenceId)
          );

          const checkOutEvent = workerMovements.find(h =>
            h.actionType === 'CHECK_OUT' ||
            (h.actionType === 'TRANSFER' && h.fromResidenceId === invoice.residenceId)
          );

          if (checkInEvent) {
            roomName = checkInEvent.roomName || checkInEvent.toRoomName || roomName;
            buildingName = checkInEvent.buildingName || buildingName;
            floorName = checkInEvent.floorName || floorName;
            originalCheckIn = checkInEvent.actionDate;
          }

          if (checkOutEvent) {
            originalCheckOut = checkOutEvent.actionDate;
          }

          // If we have room name but missing building/floor info, try to get it from residence structure
          if (roomName && (!buildingName || !floorName)) {
            const res = residences.find(r => r.id === invoice.residenceId);
            if (res) {
              for (const building of res.buildings || []) {
                for (const floor of building.floors || []) {
                  const room = floor.rooms?.find(r => r.name === roomName || r.id === roomName);
                  if (room) {
                    if (!buildingName) buildingName = building.name || '';
                    if (!floorName) floorName = floor.name || '';
                    break;
                  }
                }
                if (buildingName && floorName) break;
              }
            }
          }

          if (!roomName && currentOccupancy) {
            // Try to get room name from residence structure
            const res = residences.find(r => r.id === invoice.residenceId);
            if (res) {
              for (const building of res.buildings || []) {
                for (const floor of building.floors || []) {
                  const room = floor.rooms?.find(r => r.id === currentOccupancy.roomId);
                  if (room) {
                    roomName = room.name || currentOccupancy.roomId;
                    buildingName = building.name || '';
                    floorName = floor.name || '';
                    break;
                  }
                }
                if (roomName) break;
              }
            }
            if (!roomName) roomName = currentOccupancy.roomId;
            originalCheckIn = currentOccupancy.since;
            originalCheckOut = currentOccupancy.until || null;
          }

          // Get room info and dates from any occupancy record if not found yet
          if (!roomName && allWorkerOccupancy.length > 0) {
            const occ = allWorkerOccupancy[0];
            const res = residences.find(r => r.id === invoice.residenceId);
            if (res) {
              for (const building of res.buildings || []) {
                for (const floor of building.floors || []) {
                  const room = floor.rooms?.find(r => r.id === occ.roomId);
                  if (room) {
                    roomName = room.name || occ.roomId;
                    buildingName = building.name || '';
                    floorName = floor.name || '';
                    break;
                  }
                }
                if (roomName) break;
              }
            }
            if (!roomName) roomName = occ.roomId;
            originalCheckIn = occ.since;
            originalCheckOut = occ.until || null;
          }

          // Final fallback: if we still have room name but missing building/floor, search again
          if (roomName && (!buildingName || !floorName)) {
            const res = residences.find(r => r.id === invoice.residenceId);
            if (res) {
              for (const building of res.buildings || []) {
                for (const floor of building.floors || []) {
                  const room = floor.rooms?.find(r => r.name === roomName || r.id === roomName);
                  if (room) {
                    if (!buildingName) buildingName = building.name || '';
                    if (!floorName) floorName = floor.name || '';
                    break;
                  }
                }
                if (buildingName && floorName) break;
              }
            }
          }

          // Calculate days
          let days = 0;
          let currentStatus = isInside;
          let lastDate = startDate;

          // If no movements but worker has occupancy records, calculate from occupancy
          if (workerMovements.length === 0 && allWorkerOccupancy.length > 0) {
            for (const occ of allWorkerOccupancy) {
              const occStart = new Date(occ.since);
              const occEnd = occ.until ? new Date(occ.until) : endDate;

              // Calculate overlap with billing period
              const effectiveStart = occStart > startDate ? occStart : startDate;
              const effectiveEnd = occEnd < endDate ? occEnd : endDate;

              if (effectiveStart <= effectiveEnd) {
                // +1 to include both start and end days (same day = 1, consecutive = 2)
                const diff = differenceInDays(effectiveEnd, effectiveStart) + 1;
                days += Math.max(0, diff);
              }
            }
          } else {
            // Use movement-based calculation
            for (const event of workerMovements) {
              const eventDate = new Date(event.actionDate);
              if (eventDate < startDate) continue;
              if (eventDate > endDate) break;

              if (currentStatus) {
                // +1 to include both start and end days (same day = 1, consecutive = 2)
                const diff = differenceInDays(eventDate, lastDate) + 1;
                days += diff;
              }

              const isTransferIn = event.actionType === 'TRANSFER' && event.toResidenceId === invoice.residenceId;
              if (event.actionType === 'CHECK_IN' || isTransferIn) {
                currentStatus = true;
              } else {
                currentStatus = false;
              }
              lastDate = eventDate;
            }

            // After last event, if still inside, add days until endDate
            if (currentStatus) {
              // +1 to include both start and end days (same day = 1, consecutive = 2)
              const diff = differenceInDays(endDate, lastDate) + 1;
              days += diff;
            }
          }

          if (days > 0) {
            const rate = contract?.ratePerPersonPerMonth || invoice.ratePerPerson || 0;
            const amount = (rate / 30) * days;

            // Calculate effective dates within the billing period
            const workerCheckIn = originalCheckIn ? new Date(originalCheckIn) : startDate;
            const workerCheckOut = originalCheckOut ? new Date(originalCheckOut) : endDate;
            const effectiveStart = workerCheckIn < startDate ? startDate : workerCheckIn;
            const effectiveEnd = workerCheckOut > endDate ? endDate : workerCheckOut;

            details.push({
              workerId: worker.id,
              name: worker.name,
              employeeId: worker.employeeId,
              idNumber: worker.idNumber,
              nationality: worker.nationaliy,
              roomName,
              buildingName,
              floorName,
              checkInDate: originalCheckIn || startDate.toISOString(),
              checkOutDate: originalCheckOut,
              effectiveCheckIn: effectiveStart.toISOString(),
              effectiveCheckOut: effectiveEnd.toISOString(),
              days,
              amount: Math.round(amount * 100) / 100,
            });
          }
        }

        if (isMounted) {
          setWorkerDetails(details.sort((a, b) => a.name.localeCompare(b.name, 'ar')));
        }
      } catch (err) {
        console.error("Error calculating worker details:", err);
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    };

    fetchDetails();
    return () => { isMounted = false; };
  }, [invoice, company, workers, occupants, residences, contract, fetchHistoryByDateRange]);;

c = c.replace(searchReg, replacement);
c = c.replace(/accommodationHistory,/g, '');
c = c.replace(/getHistoryByDateRange,/g, 'fetchHistoryByDateRange,');

fs.writeFileSync('src/app/accommodation/invoices/[id]/page.tsx', c);
console.log('patched invoices!');
