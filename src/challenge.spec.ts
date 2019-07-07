import {ConcurrencyHandlerById} from './challenge'

const concurrencyHandlerById = new ConcurrencyHandlerById()
interface TestTaskExecuted {
    id: string,
    name: string,
    timestamp: string
}

test('it should execute functions in the right order', async() => {

    const executedFunctionsArray:TestTaskExecuted[] = []
    jest.setTimeout(50000);
    const waitFor = (id : string, taskTypeName : string, time : number) => new Promise((resolve) => {
        return setTimeout(resolve, time);
    });


    const taskDone = (id:string, name:string) => {
        executedFunctionsArray.push(<TestTaskExecuted>{
            id,
            name,
        })
    }


    const lightTask = (id : string) => async() => {
        const name:string = 'lightTask'
        await waitFor(id, name, 100);
        taskDone(id, name)
    }

    const heavyTask = (id : string) => async() =>{
        const name:string = 'heavyTask'
        await waitFor(id, name, 10000);
        taskDone(id, name)
    } 

    concurrencyHandlerById.task('1', heavyTask('1'));
    concurrencyHandlerById.task('1', lightTask('1'));
    concurrencyHandlerById.task('2', heavyTask('2'));
    concurrencyHandlerById.task('2', lightTask('2'));
    concurrencyHandlerById.task('3', heavyTask('3'));
    await concurrencyHandlerById.task('3', lightTask('3'));

    expect(executedFunctionsArray).toEqual(    
        [ { id: '1', name: 'heavyTask' },
        { id: '2', name: 'heavyTask' },
        { id: '3', name: 'heavyTask' },
        { id: '1', name: 'lightTask' },
        { id: '2', name: 'lightTask' },
        { id: '3', name: 'lightTask' } ]
    )

})