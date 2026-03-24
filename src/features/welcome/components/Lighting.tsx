const Lighting = () => {
    return (
        <directionalLight
            position={[-2, 2, 3]}
            castShadow
            intensity={3}
        />
    )
}

export default Lighting;