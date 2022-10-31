export const createMaze = async (size = 5) => {
    const response = await fetch('http://localhost:5555/createMaze', {
        method: "POST",
        headers : {
            'Content-Type': 'application/json',
            "Accept": 'application/json'
        },
        body: JSON.stringify({"size": size})
    })

    return await response.json()
}