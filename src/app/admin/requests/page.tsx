
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepositRequests } from "@/components/admin/DepositRequests";
import { WithdrawalRequests } from "@/components/admin/WithdrawalRequests";

export default function AdminRequestsPage() {

    return (
        <Tabs defaultValue="deposits" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="deposits">Deposit Requests</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
            </TabsList>
            <TabsContent value="deposits" className="mt-6">
                <DepositRequests />
            </TabsContent>
            <TabsContent value="withdrawals" className="mt-6">
                <WithdrawalRequests />
            </TabsContent>
        </Tabs>
    )
}
