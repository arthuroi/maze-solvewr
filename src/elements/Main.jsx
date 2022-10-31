import { useState } from 'react'
import { useEffect } from 'react'
import { createMaze } from '../functions/createMaze'
import './stylesMainPage.css'
import generator from 'generate-maze'

let current
// const visitedCells = []
// const decisionPoints = []
const directions = ['top', 'left', 'bottom', 'right']


export const MainPage = () => {

    const [maze, setMaze] = useState()
    const [hasSetFirst, setHasSetFirst] = useState(false)
    const [c, setC] = useState(0)
    const [i, setI] = useState(0)
    const [autoRestart, setAutoRestart] = useState(false)
    const [isSolving, setIsSolving] = useState(false)
    useEffect(() => {
        setMaze(generator(25, 25, true, Math.floor(Math.random() * 100000000)).slice())
        setI(i + 1)
    }, [c])
    
    if (hasSetFirst === false && maze){
         current = maze[0][0]; setHasSetFirst(true)
        }

    if (autoRestart === true && isSolving === false) solveMaze(maze, setMaze, setC, c, autoRestart, setIsSolving)
    return(
    <div className='main-wrapper'>
        <div className='maze-wrapper'>
            {maze?.map((row, rowIndex) => row.map((cell, cellIndex) => <div className={`cell ${cell.top && !(rowIndex === 0 && cellIndex === 0)?'top':''} ${cell.right?'right':''} ${cell.left?'left':''} ${cell.bottom && !(rowIndex === 24 && cellIndex === 24)?'down':''} ${cell.visited === true ?'visited':''}  ${cell.current === true ?'current':''}`}></div>))}
        </div>
        <div className='button-wrapper'>
            <div className='button-solve' onClick={() => {solveMaze(maze, setMaze, setC, c, autoRestart, setIsSolving)}}></div>
            <div className='button-restart' onClick={() => {restartMaze(setC, c)}}></div>
            {/* <div className='button-restart current' onClick={() => setAutoRestart(!autoRestart)}></div> */}

        </div>
    </div>)
}


const restartMaze = (setC, c) => {
    current = undefined
    setC(c + 1)
}

const solveMaze = async (maze, setMaze, setC, c, autoRestart, setIsSolving) => {
    setIsSolving(true)
    const graph = await prepareGraph(maze)
    const result = await Dijsktra(graph, '0-0', '24-24', maze, setMaze)
    printDijsktra(result,'0-0','24-24', maze, setMaze, setC, c, autoRestart, setIsSolving)

}

const prepareGraph = async (maze) => {

    const addNodes = () => {
        maze?.map((row, rowIndex) => {
            row.map((cell, cellIndex) => {
                graph.set(`${rowIndex}-${cellIndex}`, [])
            })
        })
    }

    const addEdges = () => {
        let r = 0
        maze?.map((row, rowIndex) => {
            row.map((cell, cellIndex) => {
                directions.map((direction) => {
                    if (cell[direction] === false) {
                        try{
                            switch (direction) {
                                case 'top':
                                    graph.get(`${rowIndex}-${cellIndex}`).push(`${rowIndex - 1}-${cellIndex}`)
                                    r++
                                    break;
    
                                case 'left':
                                    graph.get(`${rowIndex}-${cellIndex}`).push(`${rowIndex}-${cellIndex - 1}`)
                                    r++
                                    break;
    
                                case 'bottom':
                                    graph.get(`${rowIndex}-${cellIndex}`).push(`${rowIndex + 1}-${cellIndex}`)
                                    r++
    
                                    break;
    
                                case 'right':
                                    graph.get(`${rowIndex}-${cellIndex}`).push(`${rowIndex}-${cellIndex + 1}`)
                                    r++
                                    break;
                                default:
                                    break;
                            }
                        } catch (error) {
                            console.log(error)
                            console.log(rowIndex, cellIndex)
                        }
                        
                    }
                })
            })
        })
        console.log(r)
    }

    const graph = new Map()
    await addNodes()
    await addEdges()
    return graph

    
}


const Dijsktra = async (graph, start, end, maze, setMaze) => {
    let queue = prepareGraphDijsktra(graph, start)
    let shouldStop = false
    while (getAllActiveQueueValues(queue) > 0 && !shouldStop) {
        const current = getShortestActiveItem(queue, end)

        await new Promise(r => setTimeout(r, 0));

        const destinations = graph?.get(current)
        for (const destination of destinations) {

            
            if (queue[destination].cost < Infinity) {
                if (queue[destination].cost + queue[current].cost < queue[destination].cost) {
                        queue[destination].cost = queue[current].cost + 1
                        queue[destination].shortestPath = current
                    }
            } else {
                if (queue[current].cost < queue[destination].cost) {
                    queue[destination].cost = queue[current].cost + 1
                    queue[destination].shortestPath = current
                }
            }

            if (destination === end) {
                shouldStop = true
            }

            

            maze[destination.split('-')[0]][destination.split('-')[1]].visited = true
            setMaze(maze.slice())
        }
        try{
            queue[current].active = false
        } catch (error) {
            console.log(error)
        }
    }

    return queue
}

const prepareGraphDijsktra = (graph, start) => {
    const costObject = {}
    for (const item of graph) {
        if (item[0] !== start) {
            costObject[item[0]] = {"cost": Infinity, shortestPath: undefined, active: true}
        } else {
            costObject[item[0]] = {"cost": 0, shortestPath: item[0], active: true}

        }
    }

    return costObject
}

const getAllActiveQueueValues = (queue) => {
    
    let c = 0
    Object.keys(queue)?.forEach((item) => {
        if (queue[item].active === true) {
            c++
        }
    })

    return c
}

const getShortestActiveItem = (queue, end) => {

    let recordDistance = Infinity
    let shortest
    Object.keys(queue)?.forEach((item) => {
        if (queue[item].active === true && queue[item].cost < Infinity) {
            if (calculateDistance(item, end) < recordDistance) {
                recordDistance = calculateDistance(item, end)
                shortest = item
            }

            calculateDistance(item, end)
            
        }
    })

    
    return shortest
}

const calculateDistance = (item, end) => {
    const y = item.split('-')[0]
    const x = item.split('-')[1]

    const endY = end.split('-')[0]
    const endX = end.split('-')[1]

    const yDistance = endY - y
    const xDistance = endX - x

    // return yDistance + xDistance
    return Math.sqrt( Math.pow(yDistance, 2) + Math.pow(xDistance, 2))

}
const printDijsktra = async (result,start,end, maze, setMaze, setC, c, autoRestart, setIsSolving) => {
    const path = []
    let current = end
    while (current !== start) {
        path.push(current)

        maze[current.split('-')[0]][current.split('-')[1]].current = true
            setMaze(maze.slice())

        current = result[current].shortestPath 
    }

    await new Promise(r => setTimeout(r, 1000));
    if (autoRestart === true) {
        restartMaze(setC, c)
    }

    setIsSolving(false)
    console.log(path)
}