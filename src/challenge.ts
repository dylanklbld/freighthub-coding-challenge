async function sleep(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), ms)
    })
}

async function randomDelay() {
    const randomTime = Math.round(Math.random() * 1000)
    return sleep(randomTime)
}

class ShipmentSearchIndex {
    async updateShipment(id: string, shipmentData: any) {
        const startTime = new Date()
        await randomDelay()
        const endTime = new Date()
        console.log(`update ${id}@${startTime.toISOString()} finished@${endTime.toISOString()}`)

        return { startTime, endTime }
    }
}

// Implementation needed
interface ShipmentUpdateListenerInterface {
    receiveUpdate(id: string, shipmentData: any)
}

interface TaskWithReferenceId<T> {
    id: number,
    referenceId: string,
    task: () => Promise<T>
}

export class ConcurrencyHandlerById<T = any> {
    private tasksQueue: TaskWithReferenceId<T>[] = []
    private activeTaskReferenceIdList: string[] = []
    private nextTaskId: number = 0

    private registerTask(task) {
        this.tasksQueue = [
            ...this.tasksQueue,
            task
        ]
        this.executeTasks()
    }

    private executeTasks() {
        while (this.tasksQueue.length) {
            const taskToExecute = this
                .tasksQueue
                .filter(task => !this.activeTaskReferenceIdList.includes(task.referenceId))
            const task = taskToExecute[0]

            if (!task) {
                return null
            }

            this.tasksQueue = this
                .tasksQueue
                .filter(t => {
                    return t.id !== task.id
                });

            this.activeTaskReferenceIdList = [
                ...this.activeTaskReferenceIdList,
                task.referenceId
            ]

            task
                .task()
                .then((result) => {
                    this.activeTaskReferenceIdList = this
                        .activeTaskReferenceIdList
                        .filter(id => id !== task.referenceId)
                    this.executeTasks();

                    return result;
                })
                .catch((err) => {
                    this.executeTasks();

                    throw err;
                });
        }
    }

    public task(id: string, handler: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => this.registerTask(
            <TaskWithReferenceId<any>>{
                id: this.nextTaskId++,
                referenceId: id,
                task: () => handler()
                    .then(resolve)
                    .catch(reject),
            }),
        );
    }
} 

export class ShipmentUpdateListener implements
    ShipmentUpdateListenerInterface {
        concurrencyHandlerById = new ConcurrencyHandlerById()
    shipmentSearchIndex = new ShipmentSearchIndex()

    async receiveUpdate(id: string, shipmentData: any) {

        this
            .concurrencyHandlerById
            .task(id, async () => await this.shipmentSearchIndex.updateShipment(id, shipmentData))

    }
}