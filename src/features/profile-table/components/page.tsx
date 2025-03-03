import { Payment, columns } from "@/features/profile-table/components/columns"
import { GsxProfilesTable } from "../../../features/profile-table/components/data-table"

async function getData(): Promise<Payment[]> {
    // Fetch data from your API here.
    return [
        {
            id: "728ed52f",
            amount: 100,
            status: "pending",
            email: "m@example.com",
        },
        // ...
    ]
}

export default async function DemoPage() {
    const data = await getData()

    return (
        <div className="container mx-auto py-10">
            <GsxProfilesTable />
        </div>
    )
}
