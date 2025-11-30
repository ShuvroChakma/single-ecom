
export default function DataDisplay({ data }: { data: any }) {
    return (
        <div>
            <h1>Data Display</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    )
}