"""Strict AST translator for the supported PennyLane teaching subset."""
import ast
import math
import time
from collections import Counter
import pennylane as qml


def _constant(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)): return node.value
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub): return -_constant(node.operand)
    if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name) and node.value.id == "math" and node.attr == "pi": return math.pi
    if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub, ast.Mult, ast.Div)):
        left, right = _constant(node.left), _constant(node.right)
        return {ast.Add: left + right, ast.Sub: left - right, ast.Mult: left * right, ast.Div: left / right}[type(node.op)]
    raise ValueError("Only numeric gate angles are allowed.")


def _wire(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, int): return node.value
    raise ValueError("Only literal wire indexes are allowed in PennyLane source.")


def run_pennylane(code: str, shots: int = 1024):
    started = time.perf_counter()
    try: tree = ast.parse(code)
    except SyntaxError as error: raise ValueError(f"Invalid Python: {error.msg}") from error
    function = next((item for item in tree.body if isinstance(item, ast.FunctionDef) and item.name == "circuit"), None)
    if not function: raise ValueError("PennyLane code must define a circuit() QNode.")
    operations, wires, return_kind = [], set(), "counts"
    names = {"Hadamard": qml.Hadamard, "PauliX": qml.PauliX, "PauliY": qml.PauliY, "PauliZ": qml.PauliZ, "S": qml.S, "T": qml.T, "RX": qml.RX, "RY": qml.RY, "RZ": qml.RZ, "CNOT": qml.CNOT, "CZ": qml.CZ, "SWAP": qml.SWAP}
    for statement in function.body:
        if isinstance(statement, ast.Return):
            if isinstance(statement.value, ast.Call) and isinstance(statement.value.func, ast.Attribute) and statement.value.func.attr in {"counts", "probs"}:
                return_kind = statement.value.func.attr
                continue
            raise ValueError("Return qml.counts() or qml.probs() from circuit().")
        if not (isinstance(statement, ast.Expr) and isinstance(statement.value, ast.Call) and isinstance(statement.value.func, ast.Attribute) and isinstance(statement.value.func.value, ast.Name) and statement.value.func.value.id == "qml"):
            raise ValueError("Only supported qml gate calls are allowed inside circuit().")
        call, name = statement.value, statement.value.func.attr
        if name not in names: raise ValueError(f"Unsupported PennyLane operation: {name}")
        wire_node = next((keyword.value for keyword in call.keywords if keyword.arg == "wires"), None)
        if wire_node is None: raise ValueError(f"{name} must specify wires.")
        if isinstance(wire_node, (ast.List, ast.Tuple)): target = [_wire(item) for item in wire_node.elts]
        else: target = _wire(wire_node)
        op_args = [_constant(arg) for arg in call.args]
        operations.append((names[name], op_args, target)); wires.update(target if isinstance(target, list) else [target])
    if not wires or max(wires) >= 20: raise ValueError("Circuit must use between 1 and 20 literal wires.")
    wire_count = max(wires) + 1
    device = qml.device("default.qubit", wires=wire_count, shots=shots)

    @qml.qnode(device)
    def circuit():
        for gate, args, target in operations: gate(*args, wires=target)
        return qml.counts() if return_kind == "counts" else qml.probs(wires=range(wire_count))

    raw = circuit()
    if return_kind == "counts": counts = {str(key): int(value) for key, value in raw.items()}
    else:
        counts = {format(index, f"0{wire_count}b"): int(round(float(prob) * shots)) for index, prob in enumerate(raw) if prob > 0}
    return {"success": True, "framework": "pennylane", "output": "PennyLane default.qubit execution completed.", "circuit": "\n".join(f"{gate.__name__}({target})" for gate, _, target in operations), "measurements": counts, "counts": counts, "probabilities": {state: count / shots for state, count in counts.items()}, "shots": shots, "execution_time": round(time.perf_counter() - started, 6), "error": None}
