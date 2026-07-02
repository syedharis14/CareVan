-- Defense in depth against duplicate alerts: at most one event of each type per
-- student per trip. A re-tap that dodges the client guard collides here (P2002)
-- and is treated as a duplicate rather than creating a second alert.
CREATE UNIQUE INDEX "TripEvent_tripId_studentId_type_key" ON "TripEvent"("tripId", "studentId", "type");
