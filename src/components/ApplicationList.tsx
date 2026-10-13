import type { Application } from "../types"
import { ApplicationCard } from "./ApplicationCard"

type ApplicationProp = {
applications: Application[]
}

export const ApplicationList = ({applications}: ApplicationProp) => {

    return (
        <>
        {applications.map((i) => {
            return (
                <div>
                <ApplicationCard application={i} />
                </div>
            )
        }
   

    )}

    </>
    )
}