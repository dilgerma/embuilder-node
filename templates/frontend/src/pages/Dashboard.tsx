import {DashboardLayout} from "@/components/layout/DashboardLayout";
import {Calendar, ClipboardList} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useApiContext} from "@/hooks/useApiContext";

export default function Dashboard() {
    const ctx = useApiContext();
    //const {data: activeShifts = [], isLoading: shiftsLoading} = useActiveShiftsForDashboard();

    /*const handleNoShow = useCallback((reservationId: string) => {
        registerNoShow(reservationId, ctx).catch(console.error);
    }, [ctx]);*/

    return (
        <DashboardLayout title="Overview" subtitle="Welcome back! Here is your summary.">
            <div></div>
            {/* Quick Actions & Recent Activity
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5 text-primary"/>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                    </CardContent>
                </Card>
            </div>*/}
        </DashboardLayout>
    );
}
