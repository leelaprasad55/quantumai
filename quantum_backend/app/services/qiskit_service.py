"""Restricted Qiskit source compiler. User source is parsed, never executed."""
import ast
import math
import time
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

MAX_QUBITS = 20


def _number(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub): return -_number(node.operand)
    if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name) and node.value.id == "math" and node.attr == "pi": return math.pi
    if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub, ast.Mult, ast.Div)):
        left, right = _number(node.left), _number(node.right)
        return {ast.Add: left + right, ast.Sub: left - right, ast.Mult: left * right, ast.Div: left / right}[type(node.op)]
    raise ValueError("Gate angles must be numeric constants or math.pi expressions.")


def _integer(node):
    value = _number(node)
    if not value.is_integer(): raise ValueError("Qubit indexes must be integers.")
    return int(value)


def _indexes(node):
    """Parse a safe Qiskit qubit/classical-bit index or a literal index list."""
    if isinstance(node, (ast.List, ast.Tuple)):
        return [_integer(element) for element in node.elts]
    return _integer(node)


def compile_qiskit(code: str) -> QuantumCircuit:
    try: tree = ast.parse(code, mode="exec")
    except SyntaxError as exc: raise ValueError(f"Invalid Python: {exc.msg}") from exc
    circuit = None
    allowed = {"h", "x", "y", "z", "s", "t", "rx", "ry", "rz", "cx", "cnot", "cz", "swap", "measure", "measure_all", "barrier"}
    for statement in tree.body:
        if isinstance(statement, (ast.Import, ast.ImportFrom)): continue
        if isinstance(statement, ast.Assign):
            if not (len(statement.targets) == 1 and isinstance(statement.targets[0], ast.Name) and statement.targets[0].id == "qc" and isinstance(statement.value, ast.Call)): continue
            call = statement.value
            if not (isinstance(call.func, ast.Name) and call.func.id == "QuantumCircuit" and call.args): raise ValueError("Create the circuit with qc = QuantumCircuit(qubits[, clbits]).")
            qubits, clbits = _integer(call.args[0]), _integer(call.args[1]) if len(call.args) > 1 else 0
            if qubits < 1 or qubits > MAX_QUBITS or clbits < 0 or clbits > qubits: raise ValueError(f"Circuit must use 1–{MAX_QUBITS} qubits and no more classical bits than qubits.")
            circuit = QuantumCircuit(qubits, clbits); continue
        if not (isinstance(statement, ast.Expr) and isinstance(statement.value, ast.Call)): raise ValueError("Only circuit construction and gate calls are allowed.")
        call = statement.value
        if not (isinstance(call.func, ast.Attribute) and isinstance(call.func.value, ast.Name) and call.func.value.id == "qc"): raise ValueError("Gate calls must target qc.")
        if circuit is None: raise ValueError("Define qc before applying gates.")
        name = "cx" if call.func.attr.lower() == "cnot" else call.func.attr.lower()
        if name not in allowed or call.keywords: raise ValueError(f"Unsupported Qiskit operation: {call.func.attr}")
        args = call.args
        if name in {"rx", "ry", "rz"}:
            if len(args) != 2: raise ValueError(f"{name.upper()} requires an angle and target qubit.")
            getattr(circuit, name)(_number(args[0]), _integer(args[1]))
        elif name in {"cx", "cz", "swap"}:
            if len(args) != 2: raise ValueError(f"{name.upper()} requires two indexes.")
            getattr(circuit, name)(_integer(args[0]), _integer(args[1]))
        elif name == "measure":
            if len(args) != 2: raise ValueError("MEASURE requires qubit and classical-bit indexes.")
            getattr(circuit, name)(_indexes(args[0]), _indexes(args[1]))
        elif name == "measure_all": circuit.measure_all()
        elif name == "barrier": circuit.barrier()
        else:
            if len(args) != 1: raise ValueError(f"{name.upper()} requires one target qubit.")
            getattr(circuit, name)(_integer(args[0]))
    if circuit is None: raise ValueError("Qiskit code must create a QuantumCircuit named 'qc'.")
    return circuit


def run_qiskit(code: str, shots: int = 1024):
    started = time.perf_counter(); circuit = compile_qiskit(code)
    if circuit.num_clbits == 0: circuit.measure_all()
    simulator = AerSimulator(); compiled = transpile(circuit, simulator)
    counts = dict(simulator.run(compiled, shots=shots).result().get_counts())
    probabilities = {state: count / shots for state, count in counts.items()}
    return {"success": True, "framework": "qiskit", "output": "Qiskit Aer execution completed.", "circuit": str(circuit), "measurements": counts, "counts": counts, "probabilities": probabilities, "shots": shots, "execution_time": round(time.perf_counter() - started, 6), "error": None}
