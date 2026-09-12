"""Strict AST translator for the generated Cirq circuit format."""
import ast
import math
import time
import cirq


def _index(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, int): return node.value
    if isinstance(node, ast.Subscript) and isinstance(node.value, ast.Name) and node.value.id == "qubits" and isinstance(node.slice, ast.Constant): return node.slice.value
    raise ValueError("Cirq gates must use qubits[index].")


def _angle(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)): return float(node.value)
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub): return -_angle(node.operand)
    if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name) and node.value.id == "math" and node.attr == "pi": return math.pi
    if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub, ast.Mult, ast.Div)):
        left, right = _angle(node.left), _angle(node.right)
        return {ast.Add: left + right, ast.Sub: left - right, ast.Mult: left * right, ast.Div: left / right}[type(node.op)]
    raise ValueError("Cirq rotation angles must be numeric constants or math.pi expressions.")


def run_cirq(code: str, shots: int = 1024):
    started = time.perf_counter()
    try: tree = ast.parse(code)
    except SyntaxError as error: raise ValueError(f"Invalid Python: {error.msg}") from error
    qubit_count, operations = None, []
    for statement in tree.body:
        if isinstance(statement, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "qubits" for t in statement.targets):
            # Accept generated: [cirq.LineQubit(i) for i in range(N)]
            try: qubit_count = statement.value.generators[0].iter.args[0].value
            except Exception as error: raise ValueError("Define qubits as [cirq.LineQubit(i) for i in range(N)].") from error
        if not (isinstance(statement, ast.Expr) and isinstance(statement.value, ast.Call)): continue
        call = statement.value
        if not (isinstance(call.func, ast.Attribute) and isinstance(call.func.value, ast.Name) and call.func.value.id == "circuit" and call.func.attr == "append" and call.args): continue
        gate_call = call.args[0]
        if not isinstance(gate_call, ast.Call): raise ValueError("Only cirq gate calls may be appended.")
        # Generated rotations have the form cirq.rx(angle)(qubits[index]).
        if isinstance(gate_call.func, ast.Call):
            factory = gate_call.func
            if not (isinstance(factory.func, ast.Attribute) and isinstance(factory.func.value, ast.Name) and factory.func.value.id == "cirq" and factory.func.attr in {"rx", "ry", "rz"}):
                raise ValueError("Only supported cirq gate calls may be appended.")
            if len(factory.args) != 1 or factory.keywords: raise ValueError(f"{factory.func.attr} requires one numeric angle.")
            operations.append((getattr(cirq, factory.func.attr)(_angle(factory.args[0])), [_index(arg) for arg in gate_call.args]))
            continue
        if not (isinstance(gate_call.func, ast.Attribute) and isinstance(gate_call.func.value, ast.Name) and gate_call.func.value.id == "cirq"): raise ValueError("Only cirq gate calls may be appended.")
        name = gate_call.func.attr
        if name == "measure": continue
        allowed = {"H": cirq.H, "X": cirq.X, "Y": cirq.Y, "Z": cirq.Z, "S": cirq.S, "T": cirq.T, "CNOT": cirq.CNOT, "CZ": cirq.CZ, "SWAP": cirq.SWAP}
        if name not in allowed: raise ValueError(f"Unsupported Cirq operation: {name}")
        operations.append((allowed[name], [_index(arg) for arg in gate_call.args]))
    if not isinstance(qubit_count, int) or not 1 <= qubit_count <= 20: raise ValueError("Cirq source must define 1–20 qubits.")
    qubits, circuit = cirq.LineQubit.range(qubit_count), cirq.Circuit()
    for gate, targets in operations: circuit.append(gate(*[qubits[target] for target in targets]))
    circuit.append(cirq.measure(*qubits, key="result"))
    histogram = cirq.Simulator().run(circuit, repetitions=shots).histogram(key="result")
    counts = {format(state, f"0{qubit_count}b"): int(count) for state, count in histogram.items()}
    return {"success": True, "framework": "cirq", "output": "Cirq Simulator execution completed.", "circuit": str(circuit), "measurements": counts, "counts": counts, "probabilities": {state: count / shots for state, count in counts.items()}, "shots": shots, "execution_time": round(time.perf_counter() - started, 6), "error": None}
