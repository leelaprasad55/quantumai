from app.config import settings

def get_service():
    if not settings.ibm_quantum_api_key:
        raise RuntimeError("IBM_QUANTUM_API_KEY is not configured.")
    if not settings.ibm_quantum_instance:
        raise RuntimeError("IBM_QUANTUM_INSTANCE is not configured.")

    # Import lazily: an optional cloud SDK or platform DLL must never prevent
    # local simulator endpoints from starting.
    from qiskit_ibm_runtime import QiskitRuntimeService
    return QiskitRuntimeService(
        channel="ibm_quantum_platform",
        token=settings.ibm_quantum_api_key,
        instance=settings.ibm_quantum_instance,
    )


def get_backends():
    service = get_service()

    backends = service.backends(
        simulator=False,
        operational=True,
    )

    result = []

    for backend in backends:
        status = backend.status()
        result.append({
            "name": backend.name,
            "qubits": backend.num_qubits,
            "operational": status.operational,
            "pending_jobs": status.pending_jobs,
            "status": status.status_msg,
        })

    return result


def submit_circuit(code=None, backend_name=None, shots=1024):
    """Submit a real job to IBM Quantum hardware.

    If `code` (Qiskit source, e.g. from the Lab's Code tab) is supplied, it is
    compiled with the same restricted AST parser used for local simulation
    (app.services.qiskit_service.compile_qiskit) — the exact circuit the user
    built is what gets sent to the real QPU. If no code is supplied, falls
    back to a fixed 2-qubit Bell-state demo circuit for backward compatibility.
    """
    from qiskit.transpiler import generate_preset_pass_manager
    from qiskit_ibm_runtime import SamplerV2 as Sampler
    from app.services.qiskit_service import compile_qiskit
    service = get_service()

    if code:
        circuit = compile_qiskit(code)
        if circuit.num_clbits == 0:
            circuit.measure_all()
    else:
        from qiskit import QuantumCircuit
        circuit = QuantumCircuit(2)
        circuit.h(0)
        circuit.cx(0, 1)
        circuit.measure_all()

    if backend_name:
        backend = service.backend(backend_name)
        status = backend.status()
        if not status.operational:
            raise RuntimeError(
                f"Backend {backend_name} is not operational."
            )
        if backend.num_qubits < circuit.num_qubits:
            raise RuntimeError(
                f"Backend {backend_name} has {backend.num_qubits} qubits, "
                f"fewer than the {circuit.num_qubits} this circuit needs."
            )
    else:
        backend = service.least_busy(
            operational=True,
            simulator=False,
            min_num_qubits=circuit.num_qubits,
        )

    pass_manager = generate_preset_pass_manager(
        backend=backend,
        optimization_level=1,
    )
    isa_circuit = pass_manager.run(circuit)

    sampler = Sampler(mode=backend)
    job = sampler.run([isa_circuit], shots=shots)

    return {
        "job_id": job.job_id(),
        "backend": backend.name,
        "status": "QUEUED",
    }


def get_job(job_id):
    service = get_service()
    job = service.retrieve_job(job_id)

    status = str(job.status())
    response = {
        "job_id": job_id,
        "status": status,
    }

    if status.upper() in {"DONE", "COMPLETED"}:
        result = job.result()
        pub_result = result[0]
        counts = pub_result.data.meas.get_counts()
        response["counts"] = counts

    return response
